import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { booking } from "@/lib/schema";
import { calculateFare, type VehicleType, type TripMode } from "@/lib/booking-summary";

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
  vehicleType: VehicleType;
  vehicleLabel: string;
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
    date, time, meridiem, passengerCount, vehicleType, vehicleLabel,
    routeDistanceMeters, routeDistanceText, routeDurationText,
  } = body;

  if (
    !tripMode || !pickupLocation || !dropLocation ||
    !date || !time || !meridiem || !passengerCount ||
    !vehicleType || !vehicleLabel ||
    !routeDistanceMeters || !routeDistanceText || !routeDurationText
  ) {
    return NextResponse.json({ message: "Missing required booking fields." }, { status: 400 });
  }

  const fareFloat = calculateFare(vehicleType, routeDistanceMeters);
  const totalFareCents = Math.round(fareFloat * 100);

  const db = getDb();

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
    passengerCount: parseInt(passengerCount, 10),
    vehicleType,
    vehicleLabel,
    routeDistanceMeters,
    routeDistanceText,
    routeDurationText,
    totalFareCents,
  };

  void existingPending; // checked but not blocking — multiple bookings allowed

  try {
    const [inserted] = await db.insert(booking).values(newBooking).returning({
      id: booking.id,
      confirmationId: booking.confirmationId,
      status: booking.status,
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
