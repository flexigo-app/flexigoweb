import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user, vehicleConfig } from "@/lib/schema";

type VehiclePatch = {
  name?: unknown;
  baseFareCents?: unknown;
  perMileCents?: unknown;
  minimumFareCents?: unknown;
  passengerCapacity?: unknown;
  luggageCapacity?: unknown;
  sortOrder?: unknown;
  isActive?: unknown;
};

function readInteger(value: unknown, field: string, minimum: number) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
    return `${field} must be a whole number of at least ${minimum}.`;
  }

  return null;
}

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return null;

  const db = getDb();
  const [caller] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return caller?.role === "admin" ? db : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = await requireAdmin(request);
  if (!db) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: VehiclePatch;
  try {
    body = (await request.json()) as VehiclePatch;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { id } = await params;
  const [existing] = await db.select({ id: vehicleConfig.id }).from(vehicleConfig).where(eq(vehicleConfig.id, id)).limit(1);
  if (!existing) return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });

  const updates: Partial<typeof vehicleConfig.$inferInsert> = { updatedAt: new Date() };
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) {
      return NextResponse.json({ message: "Vehicle name must be between 1 and 60 characters." }, { status: 422 });
    }
    updates.name = name;
  }

  const integerFields = [
    ["baseFareCents", "Base fare", 0],
    ["perMileCents", "Per-mile rate", 0],
    ["minimumFareCents", "Minimum fare", 0],
    ["passengerCapacity", "Passenger capacity", 1],
    ["luggageCapacity", "Luggage capacity", 0],
    ["sortOrder", "Sort order", 0],
  ] as const;

  for (const [key, label, minimum] of integerFields) {
    if (body[key] !== undefined) {
      const error = readInteger(body[key], label, minimum);
      if (error) return NextResponse.json({ message: error }, { status: 422 });
      updates[key] = body[key] as number;
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ message: "Active status must be true or false." }, { status: 422 });
    }
    updates.isActive = body.isActive;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ message: "No changes were provided." }, { status: 422 });
  }

  const [updated] = await db.update(vehicleConfig).set(updates).where(eq(vehicleConfig.id, id)).returning();
  return NextResponse.json(updated);
}