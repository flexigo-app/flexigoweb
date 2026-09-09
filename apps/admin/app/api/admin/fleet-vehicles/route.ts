import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { booking, fleetVehicle, user, vehicleConfig } from "@/lib/schema";

const ACTIVE_ASSIGNMENT_STATUSES = ["pending", "confirmed", "paid", "assigned"] as const;

const getScheduleStartMinutes = (time: string, meridiem: string) => {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  return ((hours % 12) + (meridiem === "PM" ? 12 : 0)) * 60 + minutes;
};

const getDurationMinutes = (durationText: string) => {
  const hours = Number(durationText.match(/(\d+)\s*hr/)?.[1] ?? 0);
  const minutes = Number(durationText.match(/(\d+)\s*min/)?.[1] ?? 0);
  const duration = hours * 60 + minutes;
  return duration > 0 ? duration : null;
};

const schedulesOverlap = (
  first: { time: string; meridiem: string; routeDurationText: string },
  second: { time: string; meridiem: string; routeDurationText: string }
) => {
  const firstStart = getScheduleStartMinutes(first.time, first.meridiem);
  const secondStart = getScheduleStartMinutes(second.time, second.meridiem);
  const firstDuration = getDurationMinutes(first.routeDurationText);
  const secondDuration = getDurationMinutes(second.routeDurationText);
  if (firstStart === null || secondStart === null || firstDuration === null || secondDuration === null) return true;
  return firstStart < secondStart + secondDuration && secondStart < firstStart + firstDuration;
};

type FleetVehiclePayload = {
  vehicleConfigId?: unknown;
  label?: unknown;
  make?: unknown;
  model?: unknown;
  year?: unknown;
  vin?: unknown;
  registrationNumber?: unknown;
  insurancePolicyNumber?: unknown;
  insuranceExpiryDate?: unknown;
};

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return null;
  const db = getDb();
  const [caller] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
  return caller?.role === "admin" ? db : null;
}

export async function GET(request: NextRequest) {
  const db = await requireAdmin(request);
  if (!db) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const vehicles = await db
    .select({
      id: fleetVehicle.id,
      vehicleConfigId: fleetVehicle.vehicleConfigId,
      vehicleTypeName: vehicleConfig.name,
      label: fleetVehicle.label,
      make: fleetVehicle.make,
      model: fleetVehicle.model,
      year: fleetVehicle.year,
      registrationNumber: fleetVehicle.registrationNumber,
      status: fleetVehicle.status,
    })
    .from(fleetVehicle)
    .innerJoin(vehicleConfig, eq(fleetVehicle.vehicleConfigId, vehicleConfig.id))
    .orderBy(asc(fleetVehicle.label));

  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json(vehicles);

  const [requestedBooking] = await db
    .select({ id: booking.id, date: booking.date, time: booking.time, meridiem: booking.meridiem, routeDurationText: booking.routeDurationText })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);
  if (!requestedBooking) return NextResponse.json({ message: "Booking not found." }, { status: 404 });

  const scheduledAssignments = await db
    .select({ fleetVehicleId: booking.assignedFleetVehicleId, time: booking.time, meridiem: booking.meridiem, routeDurationText: booking.routeDurationText })
    .from(booking)
    .where(and(eq(booking.date, requestedBooking.date), inArray(booking.status, [...ACTIVE_ASSIGNMENT_STATUSES]), ne(booking.id, requestedBooking.id)));

  const unavailableVehicleIds = new Set(
    scheduledAssignments
      .filter((scheduled) => scheduled.fleetVehicleId && schedulesOverlap(requestedBooking, scheduled))
      .map((scheduled) => scheduled.fleetVehicleId)
  );

  return NextResponse.json(vehicles.filter((vehicle) => vehicle.status === "available" && !unavailableVehicleIds.has(vehicle.id)));
}

export async function POST(request: NextRequest) {
  const db = await requireAdmin(request);
  if (!db) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  let body: FleetVehiclePayload;
  try { body = (await request.json()) as FleetVehiclePayload; } catch { return NextResponse.json({ message: "Invalid request body." }, { status: 400 }); }

  const stringFields = ["vehicleConfigId", "label", "make", "model", "vin", "registrationNumber", "insurancePolicyNumber", "insuranceExpiryDate"] as const;
  for (const field of stringFields) {
    if (typeof body[field] !== "string" || !body[field].trim()) return NextResponse.json({ message: `${field} is required.` }, { status: 422 });
  }
  if (typeof body.year !== "number" || !Number.isSafeInteger(body.year) || body.year < 1990 || body.year > 2100) {
    return NextResponse.json({ message: "Vehicle year is invalid." }, { status: 422 });
  }

  const vehicleConfigId = body.vehicleConfigId as string;
  const label = body.label as string;
  const make = body.make as string;
  const model = body.model as string;
  const vin = body.vin as string;
  const registrationNumber = body.registrationNumber as string;
  const insurancePolicyNumber = body.insurancePolicyNumber as string;
  const insuranceExpiryDate = body.insuranceExpiryDate as string;

  const id = `fleet-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    const [created] = await db.insert(fleetVehicle).values({
      id,
      vehicleConfigId: vehicleConfigId.trim(),
      label: label.trim(),
      make: make.trim(),
      model: model.trim(),
      year: body.year,
      vin: vin.trim().toUpperCase(),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      insurancePolicyNumber: insurancePolicyNumber.trim(),
      insuranceExpiryDate: insuranceExpiryDate.trim(),
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ message: "VIN or registration number is already in use." }, { status: 409 });
  }
}