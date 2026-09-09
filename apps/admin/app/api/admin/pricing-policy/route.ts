import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pricingPolicy, user } from "@/lib/schema";

const POLICY_ID = "default";

type PricingPolicyPatch = {
  platformCommissionBps?: unknown;
  bookingFeeCents?: unknown;
  airportAccessFeeCents?: unknown;
  taxRateBps?: unknown;
  fleetDriverTripPayCents?: unknown;
  fleetDriverPerMileCents?: unknown;
  fleetFuelCostPerMileCents?: unknown;
  fleetVehicleReservePerMileCents?: unknown;
  paymentProcessingBps?: unknown;
};

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

function validateInteger(value: unknown, label: string, maximum: number) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > maximum) {
    return `${label} must be a whole number between 0 and ${maximum}.`;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const db = await requireAdmin(request);
  if (!db) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const [policy] = await db.select().from(pricingPolicy).where(eq(pricingPolicy.id, POLICY_ID)).limit(1);
  if (!policy) return NextResponse.json({ message: "Pricing policy is not configured." }, { status: 404 });

  return NextResponse.json(policy);
}

export async function PATCH(request: NextRequest) {
  const db = await requireAdmin(request);
  if (!db) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: PricingPolicyPatch;
  try {
    body = (await request.json()) as PricingPolicyPatch;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const fields = [
    ["platformCommissionBps", "Platform commission", 10000],
    ["bookingFeeCents", "Booking fee", 100000],
    ["airportAccessFeeCents", "Airport access fee", 100000],
    ["taxRateBps", "Tax rate", 10000],
    ["fleetDriverTripPayCents", "Fleet driver trip pay", 100000],
    ["fleetDriverPerMileCents", "Fleet driver per-mile pay", 100000],
    ["fleetFuelCostPerMileCents", "Fleet fuel cost per mile", 100000],
    ["fleetVehicleReservePerMileCents", "Fleet vehicle reserve per mile", 100000],
    ["paymentProcessingBps", "Payment processing rate", 10000],
  ] as const;
  const updates: Partial<typeof pricingPolicy.$inferInsert> = { updatedAt: new Date() };

  for (const [key, label, maximum] of fields) {
    if (body[key] === undefined) continue;
    const error = validateInteger(body[key], label, maximum);
    if (error) return NextResponse.json({ message: error }, { status: 422 });
    updates[key] = body[key] as number;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ message: "No pricing changes were provided." }, { status: 422 });
  }

  const [updated] = await db
    .update(pricingPolicy)
    .set(updates)
    .where(eq(pricingPolicy.id, POLICY_ID))
    .returning();

  if (!updated) return NextResponse.json({ message: "Pricing policy is not configured." }, { status: 404 });
  return NextResponse.json(updated);
}