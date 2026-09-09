import { NextRequest, NextResponse } from "next/server";
import { and, inArray, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { booking } from "@/lib/schema";

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

// Called daily by Vercel cron — cancels unpaid bookings whose trip date has passed.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
  }

  const todayStr = getBusinessDate();

  const db = getDb();

  try {
    const expired = await db
      .update(booking)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          inArray(booking.status, ["pending", "confirmed"]),
          lt(booking.date, todayStr)
        )
      )
      .returning({ id: booking.id, confirmationId: booking.confirmationId });

    return NextResponse.json({
      expired: expired.length,
      ids: expired.map((b) => b.confirmationId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: "Expire job failed.", detail: message }, { status: 500 });
  }
}
