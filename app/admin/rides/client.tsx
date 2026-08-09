"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSummaryDate, formatSummaryTime, formatUsDateTime } from "@/lib/booking-summary";
import { AdminShell } from "../_components/admin-shell";

type BookingStatus = "pending" | "confirmed" | "paid" | "assigned" | "completed" | "cancelled";

type AdminBooking = {
  id: string;
  confirmationId: string;
  status: BookingStatus;
  tripMode: "pickup" | "drop";
  pickupLocation: string;
  dropLocation: string;
  date: string;
  time: string;
  meridiem: "AM" | "PM";
  passengerCount: number;
  vehicleLabel: string;
  vehicleType: string;
  routeDistanceText: string;
  routeDurationText: string;
  totalFareCents: number;
  driverName: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
};

type TabId = "all" | "pending" | "confirmed" | "paid" | "assigned" | "completed" | "cancelled";

const TABS: { id: TabId; label: string; color: string }[] = [
  { id: "all",       label: "All",       color: "" },
  { id: "pending",   label: "Pending",   color: "text-amber-600" },
  { id: "confirmed", label: "Approved",  color: "text-green-700" },
  { id: "paid",      label: "Paid",      color: "text-blue-700" },
  { id: "assigned",  label: "Assigned",  color: "text-cyan-700" },
  { id: "completed", label: "Completed", color: "text-purple-700" },
  { id: "cancelled", label: "Cancelled", color: "text-red-700" },
];

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-300",
  confirmed: "bg-green-50 text-green-700 border-green-300",
  paid:      "bg-blue-50 text-blue-700 border-blue-300",
  assigned:  "bg-cyan-50 text-cyan-700 border-cyan-300",
  completed: "bg-purple-50 text-purple-700 border-purple-300",
  cancelled: "bg-red-50 text-red-700 border-red-300",
};

const formatFare = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function AdminRidesClient() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [driverInputs, setDriverInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/bookings");
        if (!res.ok) throw new Error();
        setBookings((await res.json()) as AdminBooking[]);
      } catch {
        setError("Failed to load bookings.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of bookings) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [bookings]);

  const filtered = useMemo(
    () => activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab),
    [bookings, activeTab]
  );

  const patchBooking = async (id: string, body: Record<string, unknown>) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        alert(data.message ?? "Action failed.");
        return;
      }
      const updated = (await res.json()) as AdminBooking;
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminShell
      activeHref="/admin/rides"
      title="Ride Command Center"
      subtitle="Review, approve, assign and manage all ride requests"
      showBackButton
    >
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Ride Command Center</h1>
          <p className="mt-1 text-sm text-slate-500">Review, approve, assign and manage all ride requests</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {(["pending", "confirmed", "paid", "assigned"] as BookingStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveTab(s)}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${STATUS_COLORS[s]} hover:brightness-95`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}{" "}
                <span className="ml-1 font-bold">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? `border-b-2 border-[#1A6FD4] text-[#1A6FD4]`
                  : `text-slate-500 hover:text-slate-800`
              }`}
            >
              {tab.label}
              {tab.id !== "all" && counts[tab.id] ? (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">
                  {counts[tab.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-slate-400">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-700">No rides in this category</p>
            <p className="text-sm text-slate-400">Check another tab or wait for new bookings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ride) => {
              const isActing = actionLoading === ride.id;
              const fullDate = formatSummaryDate(ride.date);
              const displayTime = formatSummaryTime(ride.time, ride.meridiem);
              const driverInput = driverInputs[ride.id] ?? ride.driverName ?? "";

              return (
                <div key={ride.id} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                  {/* Card header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[ride.status]}`}>
                        {ride.status}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">{ride.confirmationId}</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatUsDateTime(ride.createdAt)}</span>
                  </div>

                  <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
                    {/* Left: route + trip info */}
                    <div>
                      {/* Customer */}
                      <div className="mb-3 flex items-center gap-2 text-sm">
                        <span className="font-bold text-slate-800">{ride.customerName}</span>
                        <span className="text-slate-400">·</span>
                        <a href={`mailto:${ride.customerEmail}`} className="text-[#1A6FD4] hover:underline">{ride.customerEmail}</a>
                        {ride.customerPhone && (
                          <>
                            <span className="text-slate-400">·</span>
                            <a href={`tel:${ride.customerPhone}`} className="text-[#1A6FD4] hover:underline">{ride.customerPhone}</a>
                          </>
                        )}
                      </div>

                      {/* Route */}
                      <div className="flex items-start gap-3">
                        <div className="flex shrink-0 flex-col items-center pt-0.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm">
                            {ride.tripMode === "pickup" ? "✈️" : "📍"}
                          </div>
                          <div className="my-1 h-5 w-px border-l-2 border-dashed border-slate-200" />
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm">
                            {ride.tripMode === "drop" ? "✈️" : "📍"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Pickup</p>
                            <p className="text-sm font-bold text-slate-800">{ride.pickupLocation}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Drop-off</p>
                            <p className="text-sm font-bold text-slate-800">{ride.dropLocation}</p>
                          </div>
                        </div>
                      </div>

                      {/* Trip meta */}
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span>📅 {fullDate}</span>
                        <span>🕐 {displayTime}</span>
                        <span>👥 {ride.passengerCount} passenger{ride.passengerCount > 1 ? "s" : ""}</span>
                        <span>🚗 {ride.vehicleLabel}</span>
                        <span>📍 {ride.routeDistanceText} · {ride.routeDurationText}</span>
                      </div>
                    </div>

                    {/* Right: fare + actions */}
                    <div className="flex min-w-[220px] flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-slate-900">{formatFare(ride.totalFareCents)}</p>
                        <p className="text-xs text-slate-400">All inclusive</p>
                      </div>

                      {/* Action buttons by status */}
                      <div className="flex w-full flex-col gap-2">
                        {ride.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => patchBooking(ride.id, { status: "confirmed" })}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
                            >
                              {isActing ? "…" : "✓ Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => { if (confirm("Cancel this booking?")) patchBooking(ride.id, { status: "cancelled" }); }}
                              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}

                        {ride.status === "paid" && (
                          <>
                            <input
                              type="text"
                              placeholder="Driver name"
                              value={driverInput}
                              onChange={(e) => setDriverInputs((prev) => ({ ...prev, [ride.id]: e.target.value }))}
                              className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-[#1A6FD4] focus:ring-2 focus:ring-[#1A6FD4]/10"
                            />
                            <button
                              type="button"
                              disabled={isActing || !driverInput.trim()}
                              onClick={() => patchBooking(ride.id, { status: "assigned", driverName: driverInput.trim() })}
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
                            >
                              {isActing ? "…" : "Assign Driver"}
                            </button>
                          </>
                        )}

                        {ride.status === "assigned" && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => { if (confirm("Mark as completed?")) patchBooking(ride.id, { status: "completed" }); }}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-purple-600 px-4 text-sm font-bold text-white transition hover:bg-purple-700 disabled:opacity-60"
                          >
                            {isActing ? "…" : "✓ Mark Completed"}
                          </button>
                        )}

                        {/* Communication shortcuts — always visible */}
                        <div className="mt-1 flex gap-2">
                          <a
                            href={`mailto:${ride.customerEmail}?subject=Your FlexiGo Ride ${ride.confirmationId}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            📧 Email
                          </a>
                          {ride.customerPhone ? (
                            <a
                              href={`tel:${ride.customerPhone}`}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              📞 Call
                            </a>
                          ) : null}
                          {(ride.status !== "completed" && ride.status !== "cancelled") && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => { if (confirm("Cancel this booking?")) patchBooking(ride.id, { status: "cancelled" }); }}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </AdminShell>
  );
}
