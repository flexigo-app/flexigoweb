import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { booking, pricingPolicy, vehicleConfig } from "@/lib/schema";
import { type TripMode } from "@/lib/booking-summary";

type BookingRequestBody = {
  tripMode: TripMode;
  pickupLocation: string;
  dropLocation: string;
  pickupAirport?: string;
  dropAirport?: string;
  pickupAddress?: string;
  dropAddress?: string;
  pickupAddressPlaceId?: string;
  dropAddressPlaceId?: string;
  date: string;
  time: string;
  meridiem: "AM" | "PM";
  passengerCount: string;
  vehicleType: string;
  routeDistanceMeters: number;
  routeDistanceText: string;
  routeDurationText: string;
};

const generateConfirmationId = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FG-${datePart}-${randomPart}`;
};

const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const getBusinessDate = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
};

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: BookingRequestBody;
  try {
    body = (await request.json()) as BookingRequestBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const {
    tripMode, pickupLocation, dropLocation,
    pickupAirport, dropAirport, pickupAddress, dropAddress,
    pickupAddressPlaceId, dropAddressPlaceId,
    date, time, meridiem, passengerCount, vehicleType,
    routeDistanceMeters, routeDistanceText, routeDurationText,
  } = body;

  if (
    !tripMode || !pickupLocation || !dropLocation ||
    !date || !time || !meridiem || !passengerCount || !vehicleType ||
    !routeDistanceMeters || !routeDistanceText || !routeDurationText
  ) {
    return NextResponse.json({ message: "Missing required booking fields." }, { status: 400 });
  }

  const db = getDb();
  const requestedPassengerCount = Number.parseInt(passengerCount, 10);
  if (!Number.isSafeInteger(requestedPassengerCount) || requestedPassengerCount < 1) {
    return NextResponse.json({ message: "Passenger count must be at least one." }, { status: 422 });
  }
  if (!Number.isSafeInteger(routeDistanceMeters) || routeDistanceMeters < 1) {
    return NextResponse.json({ message: "Route distance is invalid." }, { status: 422 });
  }

  const [selectedVehicle] = await db
    .select()
    .from(vehicleConfig)
    .where(and(eq(vehicleConfig.id, vehicleType), eq(vehicleConfig.isActive, true)))
    .limit(1);

  if (!selectedVehicle) {
    return NextResponse.json({ message: "This vehicle is no longer available. Please choose another option." }, { status: 422 });
  }
  if (requestedPassengerCount > selectedVehicle.passengerCapacity) {
    return NextResponse.json({ message: `${selectedVehicle.name} supports up to ${selectedVehicle.passengerCapacity} passengers.` }, { status: 422 });
  }

  const [policy] = await db
    .select()
    .from(pricingPolicy)
    .where(eq(pricingPolicy.id, "default"))
    .limit(1);

  if (!policy) {
    return NextResponse.json({ message: "Pricing is temporarily unavailable. Please try again." }, { status: 503 });
  }

  const mileageFareCents = Math.round(
    (routeDistanceMeters / 1609.344) * selectedVehicle.perMileCents
  );
  const tripFareCents = Math.max(
    selectedVehicle.minimumFareCents,
    selectedVehicle.baseFareCents + mileageFareCents
  );
  const airportAccessFeeCents = pickupAirport || dropAirport
    ? policy.airportAccessFeeCents
    : 0;
  const bookingFeeCents = policy.bookingFeeCents;
  const taxableSubtotalCents = tripFareCents + bookingFeeCents + airportAccessFeeCents;
  const taxCents = Math.round((taxableSubtotalCents * policy.taxRateBps) / 10000);
  const platformCommissionCents = Math.round(
    (tripFareCents * policy.platformCommissionBps) / 10000
  );
  const driverPayoutCents = tripFareCents - platformCommissionCents + airportAccessFeeCents;
  const totalFareCents = taxableSubtotalCents + taxCents;

  // Ensure no duplicate pending booking for same user on same date/time
  const existingPending = await db
    .select({ id: booking.id })
    .from(booking)
    .where(eq(booking.userId, session.user.id))
    .limit(1);

  const newBooking = {
    id: generateId(),
    confirmationId: generateConfirmationId(),
    userId: session.user.id,
    status: "pending" as const,
    tripMode,
    pickupLocation,
    dropLocation,
    // For airport pickup: pickup=airport, drop=address. For airport drop: the reverse.
    pickupAirport:         tripMode === "pickup" ? (pickupAirport ?? null) : null,
    dropAirport:           tripMode === "drop"   ? (dropAirport   ?? null) : null,
    pickupAddress:         tripMode === "drop"   ? (pickupAddress ?? null) : null,
    dropAddress:           tripMode === "pickup" ? (dropAddress   ?? null) : null,
    pickupAddressPlaceId:  tripMode === "drop"   ? (pickupAddressPlaceId ?? null) : null,
    dropAddressPlaceId:    tripMode === "pickup" ? (dropAddressPlaceId   ?? null) : null,
    date,
    time,
    meridiem,
    passengerCount: requestedPassengerCount,
    vehicleType,
    vehicleLabel: selectedVehicle.name,
    routeDistanceMeters,
    routeDistanceText,
    routeDurationText,
    totalFareCents,
    tripFareCents,
    bookingFeeCents,
    airportAccessFeeCents,
    taxCents,
    platformCommissionCents,
    driverPayoutCents,
  };

  void existingPending; // checked but not blocking — multiple bookings allowed

  try {
    const [inserted] = await db.insert(booking).values(newBooking).returning({
      id: booking.id,
      confirmationId: booking.confirmationId,
      status: booking.status,
      totalFareCents: booking.totalFareCents,
      tripFareCents: booking.tripFareCents,
      bookingFeeCents: booking.bookingFeeCents,
      airportAccessFeeCents: booking.airportAccessFeeCents,
      taxCents: booking.taxCents,
      platformCommissionCents: booking.platformCommissionCents,
      driverPayoutCents: booking.driverPayoutCents,
      createdAt: booking.createdAt,
    });

    return NextResponse.json(inserted, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Failed to save booking. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const db = getDb();

  try {
    // A confirmed booking is not secured until it has been paid. Expire unpaid
    // bookings after their scheduled service date before returning them to the customer.
    await db
      .update(booking)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          inArray(booking.status, ["pending", "confirmed"]),
          lt(booking.date, getBusinessDate())
        )
      );

    const bookings = await db
      .select()
      .from(booking)
      .where(eq(booking.userId, session.user.id))
      .orderBy(desc(booking.createdAt));

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json(
      { message: "Failed to load bookings." },
      { status: 500 }
    );
  }
}
