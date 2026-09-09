import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { pricingPolicy, vehicleConfig } from "@/lib/schema";

export async function GET() {
  const db = getDb();
  const [vehicles, policyRows] = await Promise.all([
    db
      .select({
        id: vehicleConfig.id,
        name: vehicleConfig.name,
        baseFareCents: vehicleConfig.baseFareCents,
        perMileCents: vehicleConfig.perMileCents,
        minimumFareCents: vehicleConfig.minimumFareCents,
        passengerCapacity: vehicleConfig.passengerCapacity,
        luggageCapacity: vehicleConfig.luggageCapacity,
      })
      .from(vehicleConfig)
      .where(eq(vehicleConfig.isActive, true))
      .orderBy(asc(vehicleConfig.sortOrder), asc(vehicleConfig.name)),
    db
      .select({
        bookingFeeCents: pricingPolicy.bookingFeeCents,
        airportAccessFeeCents: pricingPolicy.airportAccessFeeCents,
        taxRateBps: pricingPolicy.taxRateBps,
      })
      .from(pricingPolicy)
      .where(eq(pricingPolicy.id, "default"))
      .limit(1),
  ]);

  const policy = policyRows[0];
  if (!policy) {
    return NextResponse.json({ message: "Pricing is temporarily unavailable." }, { status: 503 });
  }

  return NextResponse.json({ vehicles, policy });
}