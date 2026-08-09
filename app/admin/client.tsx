"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatUsDateTime } from "@/lib/booking-summary";
import { AdminShell } from "./_components/admin-shell";

type BookingStatus = "pending" | "confirmed" | "paid" | "assigned" | "completed" | "cancelled";

type AdminBooking = {
  id: string;
  status: BookingStatus;
  date: string;
  totalFareCents: number;
  routeDistanceText: string;
  customerEmail: string;
  createdAt: string;
};

type WeeklyPoint = {
  day: string;
  count: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const percent = (value: number, total: number) => {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
};

export function AdminDashboardClient() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/bookings", { cache: "no-store" });
        if (!res.ok) throw new Error();
        setBookings((await res.json()) as AdminBooking[]);
      } catch {
        setError("Unable to load dashboard metrics.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    const interval = setInterval(() => void load(), 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(today.getUTCDate() - 6);

    const statusCount: Record<BookingStatus, number> = {
      pending: 0,
      confirmed: 0,
      paid: 0,
      assigned: 0,
      completed: 0,
      cancelled: 0,
    };

    let grossRevenueCents = 0;
    let weeklyBookings = 0;
    let weeklyRevenueCents = 0;

    const weekdayMap = new Map<number, number>();
    for (let i = 0; i < 7; i += 1) weekdayMap.set(i, 0);

    for (const booking of bookings) {
      statusCount[booking.status] += 1;
      grossRevenueCents += booking.totalFareCents;

      const created = new Date(booking.createdAt);
      if (!Number.isNaN(created.getTime()) && created >= sevenDaysAgo) {
        weeklyBookings += 1;
        weeklyRevenueCents += booking.totalFareCents;
        weekdayMap.set(created.getUTCDay(), (weekdayMap.get(created.getUTCDay()) ?? 0) + 1);
      }
    }

    const completed = statusCount.completed;
    const cancelled = statusCount.cancelled;
    const finished = completed + cancelled;

    const completionRate = percent(completed, finished);
    const cancellationRate = percent(cancelled, finished);

    const active =
      statusCount.pending +
      statusCount.confirmed +
      statusCount.paid +
      statusCount.assigned;

    const weeklySeries: WeeklyPoint[] = WEEKDAYS.map((day, dayIndex) => ({
      day,
      count: weekdayMap.get(dayIndex) ?? 0,
    }));

    const peakDay =
      weeklySeries.reduce((best, point) => (point.count > best.count ? point : best), {
        day: "-",
        count: 0,
      }) ?? { day: "-", count: 0 };

    return {
      statusCount,
      grossRevenueCents,
      weeklyBookings,
      weeklyRevenueCents,
      active,
      completionRate,
      cancellationRate,
      weeklySeries,
      peakDay,
    };
  }, [bookings]);

  return (
    <AdminShell activeHref="/admin">
      <section className="rounded-3xl border border-[#DCE9F7] bg-gradient-to-br from-white via-[#F5FAFF] to-[#EAF4FF] p-4 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4B88C5]">Admin Command Center</p>
            <h1 className="mt-1 text-[2.05rem] font-extrabold leading-[1.08] tracking-tight text-[#0D1C2E] sm:text-4xl">Operations and Insights</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#55708D] sm:text-base">Live booking intelligence, operations queues, and controls in one responsive workspace.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CDE3FA] bg-white px-4 py-2 text-xs font-semibold text-[#40617F]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Auto-refreshing every 30s
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      ) : null}

      <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-4">
        {[
          { label: "Total Bookings", value: bookings.length, hint: "All-time" },
          { label: "Active Rides", value: stats.active, hint: "Pending + approved + paid + assigned" },
          { label: "Weekly Bookings", value: stats.weeklyBookings, hint: "Last 7 days" },
          { label: "Gross Revenue", value: formatCurrency(stats.grossRevenueCents), hint: "All-time fare value" },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-1.5 text-[2rem] font-extrabold leading-none text-slate-900 sm:mt-2 sm:text-2xl">{card.value}</p>
            <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{card.hint}</p>
          </article>
        ))}
      </section>

      <section id="action-queues" className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Action Queues</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Pending Approval", value: stats.statusCount.pending, cta: "Review", href: "/admin/rides" },
              { label: "Awaiting Payment", value: stats.statusCount.confirmed, cta: "Follow up", href: "/admin/rides" },
              { label: "Driver Assignment", value: stats.statusCount.paid, cta: "Assign", href: "/admin/rides" },
              { label: "In Transit", value: stats.statusCount.assigned, cta: "Track", href: "/admin/rides" },
            ].map((queue) => (
              <div key={queue.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{queue.label}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-2xl font-extrabold text-slate-900">{queue.value}</p>
                  <Link href={queue.href} className="text-xs font-semibold text-[#1A6FD4] hover:underline">{queue.cta} →</Link>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article id="admin-modules" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Admin Modules</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { title: "Ride Management", description: "Approve, reject, assign, complete", href: "/admin/rides" },
              { title: "Driver Management", description: "Roster, availability, assignment", href: "/admin/drivers" },
              { title: "Transactions", description: "Revenue, payment states, payouts", href: "/admin/transactions" },
              { title: "Reports & CSV", description: "Export filtered reports and logs", href: "/admin/reports" },
              { title: "Invoicing", description: "Invoice generation and archives", href: "/admin/invoices" },
              { title: "Traffic & Sessions", description: "Website sessions and demand origin", href: "/admin/traffic" },
            ].map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#9EC8F4] hover:bg-[#F4FAFF]"
              >
                <p className="text-sm font-bold text-slate-900 group-hover:text-[#135EA6]">{module.title}</p>
                <p className="mt-1 text-xs text-slate-500">{module.description}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Weekly Booking Trend</h2>
            <span className="text-xs font-medium text-slate-500">Peak: {stats.peakDay.day} ({stats.peakDay.count})</span>
          </div>
          <div className="mt-4 grid grid-cols-7 items-end gap-2">
            {stats.weeklySeries.map((point) => {
              const max = Math.max(...stats.weeklySeries.map((p) => p.count), 1);
              const heightPercent = Math.max(10, Math.round((point.count / max) * 100));
              return (
                <div key={point.day} className="flex flex-col items-center gap-1">
                  <div className="text-[11px] font-semibold text-slate-500">{point.count}</div>
                  <div className="flex h-28 w-full items-end rounded-xl bg-slate-100 p-1">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-[#1A6FD4] to-[#5CB2FF]"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">{point.day}</div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Operational Health</h2>
          <div className="mt-4 space-y-3">
            {[
              {
                label: "Completion Rate",
                value: `${stats.completionRate}%`,
                bar: stats.completionRate,
                color: "bg-emerald-500",
              },
              {
                label: "Cancellation Rate",
                value: `${stats.cancellationRate}%`,
                bar: stats.cancellationRate,
                color: "bg-rose-500",
              },
              {
                label: "Weekly Revenue",
                value: formatCurrency(stats.weeklyRevenueCents),
                bar: Math.min(100, Math.round((stats.weeklyRevenueCents / 150000) * 100)),
                color: "bg-blue-500",
              },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{metric.label}</span>
                  <span className="font-bold text-slate-900">{metric.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${metric.color}`} style={{ width: `${Math.max(6, metric.bar)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Recent Booking Signals</h2>
          <Link href="/admin/rides" className="text-sm font-semibold text-[#1A6FD4] hover:underline">Open full ride queue</Link>
        </div>

        {isLoading ? (
          <div className="mt-4 text-sm text-slate-500">Loading insights...</div>
        ) : bookings.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500">No bookings available yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2 pr-4">Distance</th>
                  <th className="py-2 pr-4">Customer</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 8).map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-4 font-medium">{formatUsDateTime(booking.createdAt)}</td>
                    <td className="py-2 pr-4 capitalize">{booking.status}</td>
                    <td className="py-2 pr-4">{formatCurrency(booking.totalFareCents)}</td>
                    <td className="py-2 pr-4">{booking.routeDistanceText}</td>
                    <td className="py-2 pr-4">{booking.customerEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
