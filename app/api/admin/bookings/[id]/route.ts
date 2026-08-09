import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { booking, user } from "@/lib/schema";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid:      ["assigned", "cancelled"],
  assigned:  ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

type PatchBody = {
  status?: string;
  driverName?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  // Verify caller is an admin.
  const db = getDb();
  const [caller] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: booking.id, status: booking.status })
    .from(booking)
    .where(eq(booking.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }

  const { status: newStatus, driverName } = body;

  if (newStatus) {
    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { message: `Cannot transition from '${existing.status}' to '${newStatus}'.` },
        { status: 422 }
      );
    }
  }

  const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
  if (newStatus) updatePayload.status = newStatus;
  if (driverName !== undefined) updatePayload.driverName = driverName || null;
  if (newStatus === "assigned" && driverName) {
    updatePayload.driverAssignedAt = new Date();
  }

  const [updated] = await db
    .update(booking)
    .set(updatePayload)
    .where(eq(booking.id, id))
    .returning({
      id: booking.id,
      confirmationId: booking.confirmationId,
      status: booking.status,
      driverName: booking.driverName,
      updatedAt: booking.updatedAt,
    });

  return NextResponse.json(updated);
}
