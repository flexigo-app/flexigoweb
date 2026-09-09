import { and, eq, inArray, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { booking, driver, user } from "@/lib/schema";
import { getDb } from "@/lib/db";

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

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const db = getDb();
  const [caller] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (caller?.role !== "admin") return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ message: "bookingId is required." }, { status: 400 });
  const [requestedBooking] = await db.select({ id: booking.id, date: booking.date, time: booking.time, meridiem: booking.meridiem, routeDurationText: booking.routeDurationText }).from(booking).where(eq(booking.id, bookingId)).limit(1);
  if (!requestedBooking) return NextResponse.json({ message: "Booking not found." }, { status: 404 });

  const [drivers, scheduledAssignments] = await Promise.all([
    db.select({ id: driver.id, name: driver.name, status: driver.status }).from(driver).where(ne(driver.status, "offline")),
    db.select({ driverId: booking.assignedDriverId, time: booking.time, meridiem: booking.meridiem, routeDurationText: booking.routeDurationText }).from(booking).where(and(eq(booking.date, requestedBooking.date), inArray(booking.status, [...ACTIVE_ASSIGNMENT_STATUSES]), ne(booking.id, requestedBooking.id))),
  ]);

  const unavailableDriverIds = new Set(scheduledAssignments.filter((scheduled) => scheduled.driverId && schedulesOverlap(requestedBooking, scheduled)).map((scheduled) => scheduled.driverId));
  return NextResponse.json(drivers.filter((item) => !unavailableDriverIds.has(item.id)));
}