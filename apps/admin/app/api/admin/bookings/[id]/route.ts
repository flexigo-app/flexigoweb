import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { booking, driver, fleetVehicle, pricingPolicy, user } from "@/lib/schema";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid:      ["assigned", "cancelled"],
  assigned:  ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

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

type PatchBody = {
  status?: string;
  driverName?: string;
  fulfillmentMode?: unknown;
  assignedDriverId?: unknown;
  assignedFleetVehicleId?: unknown;
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
    .select({
      id: booking.id,
      status: booking.status,
      routeDistanceMeters: booking.routeDistanceMeters,
      routeDurationText: booking.routeDurationText,
      date: booking.date,
      time: booking.time,
      meridiem: booking.meridiem,
      totalFareCents: booking.totalFareCents,
      taxCents: booking.taxCents,
      airportAccessFeeCents: booking.airportAccessFeeCents,
      tripFareCents: booking.tripFareCents,
      platformCommissionCents: booking.platformCommissionCents,
      assignedFleetVehicleId: booking.assignedFleetVehicleId,
    })
    .from(booking)
    .where(eq(booking.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }

  const { status: newStatus, driverName, fulfillmentMode, assignedDriverId, assignedFleetVehicleId } = body;

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

  if (fulfillmentMode !== undefined) {
    if (existing.status !== "pending" && existing.status !== "confirmed") {
      return NextResponse.json({ message: "Fulfillment can only be changed before payment." }, { status: 422 });
    }
    if (fulfillmentMode !== "driver_owned" && fulfillmentMode !== "flexigo_fleet") {
      return NextResponse.json({ message: "Invalid fulfillment mode." }, { status: 422 });
    }
    if (typeof assignedDriverId !== "string" || !assignedDriverId) {
      return NextResponse.json({ message: "Choose a registered driver." }, { status: 422 });
    }

    const [selectedDriver] = await db
      .select({ id: driver.id, name: driver.name, status: driver.status })
      .from(driver)
      .where(eq(driver.id, assignedDriverId))
      .limit(1);
    if (!selectedDriver || selectedDriver.status === "offline") {
      return NextResponse.json({ message: "Choose an available registered driver." }, { status: 422 });
    }
    const driverBookings = await db
      .select({ time: booking.time, meridiem: booking.meridiem, routeDurationText: booking.routeDurationText })
      .from(booking)
      .where(and(eq(booking.assignedDriverId, selectedDriver.id), eq(booking.date, existing.date), inArray(booking.status, [...ACTIVE_ASSIGNMENT_STATUSES]), ne(booking.id, existing.id)));
    if (driverBookings.some((scheduled) => schedulesOverlap(existing, scheduled))) {
      return NextResponse.json({ message: "That driver is already assigned during this ride's scheduled time." }, { status: 422 });
    }

    updatePayload.fulfillmentMode = fulfillmentMode;
    updatePayload.assignedDriverId = selectedDriver.id;
    updatePayload.driverName = selectedDriver.name;
    updatePayload.driverAssignedAt = new Date();

    if (fulfillmentMode === "flexigo_fleet") {
      if (typeof assignedFleetVehicleId !== "string" || !assignedFleetVehicleId) {
        return NextResponse.json({ message: "Choose an available FlexiGo fleet vehicle." }, { status: 422 });
      }
      const [selectedFleetVehicle] = await db
        .select({ id: fleetVehicle.id })
        .from(fleetVehicle)
        .where(and(eq(fleetVehicle.id, assignedFleetVehicleId), eq(fleetVehicle.status, "available")))
        .limit(1);
      if (!selectedFleetVehicle) {
        return NextResponse.json({ message: "That FlexiGo fleet vehicle is unavailable." }, { status: 422 });
      }
      const vehicleBookings = await db
        .select({ time: booking.time, meridiem: booking.meridiem, routeDurationText: booking.routeDurationText })
        .from(booking)
        .where(and(eq(booking.assignedFleetVehicleId, selectedFleetVehicle.id), eq(booking.date, existing.date), inArray(booking.status, [...ACTIVE_ASSIGNMENT_STATUSES]), ne(booking.id, existing.id)));
      if (vehicleBookings.some((scheduled) => schedulesOverlap(existing, scheduled))) {
        return NextResponse.json({ message: "That FlexiGo vehicle is already assigned during this ride's scheduled time." }, { status: 422 });
      }
      const [policy] = await db.select().from(pricingPolicy).where(eq(pricingPolicy.id, "default")).limit(1);
      if (!policy) return NextResponse.json({ message: "Fleet pricing policy is unavailable." }, { status: 503 });

      const miles = existing.routeDistanceMeters / 1609.344;
      const fleetDriverCompensationCents = policy.fleetDriverTripPayCents + Math.round(miles * policy.fleetDriverPerMileCents);
      const fuelEstimateCents = Math.round(miles * policy.fleetFuelCostPerMileCents);
      const vehicleReserveCents = Math.round(miles * policy.fleetVehicleReservePerMileCents);
      const paymentProcessingCents = Math.round(((existing.totalFareCents - existing.taxCents) * policy.paymentProcessingBps) / 10000);
      const flexigoContributionCents = existing.totalFareCents - existing.taxCents - fleetDriverCompensationCents - fuelEstimateCents - vehicleReserveCents - paymentProcessingCents - existing.airportAccessFeeCents;

      Object.assign(updatePayload, {
        assignedFleetVehicleId: selectedFleetVehicle.id,
        fleetDriverCompensationCents,
        fuelEstimateCents,
        vehicleReserveCents,
        paymentProcessingCents,
        flexigoContributionCents,
        driverPayoutCents: fleetDriverCompensationCents,
      });
    } else {
      Object.assign(updatePayload, {
        assignedFleetVehicleId: null,
        fleetDriverCompensationCents: 0,
        fuelEstimateCents: 0,
        vehicleReserveCents: 0,
        paymentProcessingCents: 0,
        flexigoContributionCents: 0,
        driverPayoutCents: existing.tripFareCents - existing.platformCommissionCents + existing.airportAccessFeeCents,
      });
    }
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
      fulfillmentMode: booking.fulfillmentMode,
      assignedDriverId: booking.assignedDriverId,
      assignedFleetVehicleId: booking.assignedFleetVehicleId,
      driverPayoutCents: booking.driverPayoutCents,
      fleetDriverCompensationCents: booking.fleetDriverCompensationCents,
      fuelEstimateCents: booking.fuelEstimateCents,
      vehicleReserveCents: booking.vehicleReserveCents,
      paymentProcessingCents: booking.paymentProcessingCents,
      flexigoContributionCents: booking.flexigoContributionCents,
      updatedAt: booking.updatedAt,
    });

  return NextResponse.json(updated);
}
