import { NextRequest, NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { booking } from "@/lib/schema";

// Called daily by Vercel cron — cancels pending bookings whose trip date has passed.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const db = getDb();

  try {
    const expired = await db
      .update(booking)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(booking.status, "pending"),
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
