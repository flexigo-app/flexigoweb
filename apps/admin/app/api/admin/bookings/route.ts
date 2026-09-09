import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { booking, user } from "@/lib/schema";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const db = getDb();
  const [caller] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  // Join booking with user to get customer name + email.
  const bookings = await db
    .select({
      id: booking.id,
      confirmationId: booking.confirmationId,
      status: booking.status,
      fulfillmentMode: booking.fulfillmentMode,
      tripMode: booking.tripMode,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      date: booking.date,
      time: booking.time,
      meridiem: booking.meridiem,
      passengerCount: booking.passengerCount,
      vehicleLabel: booking.vehicleLabel,
      vehicleType: booking.vehicleType,
      routeDistanceText: booking.routeDistanceText,
      routeDurationText: booking.routeDurationText,
      totalFareCents: booking.totalFareCents,
      tripFareCents: booking.tripFareCents,
      bookingFeeCents: booking.bookingFeeCents,
      airportAccessFeeCents: booking.airportAccessFeeCents,
      taxCents: booking.taxCents,
      platformCommissionCents: booking.platformCommissionCents,
      driverPayoutCents: booking.driverPayoutCents,
      fleetDriverCompensationCents: booking.fleetDriverCompensationCents,
      fuelEstimateCents: booking.fuelEstimateCents,
      vehicleReserveCents: booking.vehicleReserveCents,
      paymentProcessingCents: booking.paymentProcessingCents,
      flexigoContributionCents: booking.flexigoContributionCents,
      driverName: booking.driverName,
      assignedDriverId: booking.assignedDriverId,
      assignedFleetVehicleId: booking.assignedFleetVehicleId,
      createdAt: booking.createdAt,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phoneNumber,
    })
    .from(booking)
    .innerJoin(user, eq(booking.userId, user.id))
    .orderBy(desc(booking.createdAt));

  return NextResponse.json(
    bookings.map((item) => ({
      ...item,
      pickupLabel: item.tripMode === "pickup" ? "Pickup (Airport)" : "Pickup (Address)",
      dropLabel: item.tripMode === "drop" ? "Drop (Airport)" : "Drop (Address)",
    }))
  );
}
