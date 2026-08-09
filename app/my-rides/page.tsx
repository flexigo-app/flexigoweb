"use client";
// v2

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { formatSummaryDate, formatSummaryTime } from "@/lib/booking-summary";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700"], style: ["italic"] });

type BookingStatus = "pending" | "confirmed" | "paid" | "assigned" | "completed" | "cancelled";

type Booking = {
  id: string;
  confirmationId: string;
  status: BookingStatus;
  tripMode: "pickup" | "drop";
  pickupLocation: string;
  dropLocation: string;
  pickupLabel: string;
  dropLabel: string;
  vehicleImageSrc?: string;
  date: string;
  time: string;
  meridiem: "AM" | "PM";
  passengerCount: number;
  vehicleLabel: string;
  routeDistanceText: string;
  routeDurationText: string;
  totalFareCents: number;
  driverName: string | null;
  createdAt: string;
};

type TabId = "all" | "requested" | "completed" | "cancelled";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All Rides" },
  { id: "requested", label: "Requested" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE: Record<
  BookingStatus,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  pending:   { label: "Pending Approval", icon: "🟠", color: "text-[#B45309]", bg: "bg-[#FEF3C7]", border: "border-[#FCD34D]" },
  confirmed: { label: "Approved",         icon: "✅", color: "text-[#166534]", bg: "bg-[#DCFCE7]", border: "border-[#86EFAC]" },
  paid:      { label: "Paid",             icon: "💳", color: "text-[#1E40AF]", bg: "bg-[#DBEAFE]", border: "border-[#93C5FD]" },
  assigned:  { label: "Driver Assigned",  icon: "🚗", color: "text-[#0E7490]", bg: "bg-[#CFFAFE]", border: "border-[#67E8F9]" },
  completed: { label: "Completed",        icon: "✔️", color: "text-[#6D28D9]", bg: "bg-[#EDE9FE]", border: "border-[#C4B5FD]" },
  cancelled: { label: "Cancelled",        icon: "❌", color: "text-[#991B1B]", bg: "bg-[#FEE2E2]", border: "border-[#FCA5A5]" },
};

const tabMatches = (status: BookingStatus, tab: TabId): boolean => {
  if (tab === "all") return true;
  if (tab === "requested") return status === "pending" || status === "confirmed" || status === "paid" || status === "assigned";
  if (tab === "completed") return status === "completed";
  if (tab === "cancelled") return status === "cancelled";
  return false;
};

const formatFare = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const getDaysRemaining = (dateStr: string): number | null => {
  const trip = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((trip.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const formatCardDate = (dateStr: string, timeStr: string, meridiem: "AM" | "PM") => {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const prefix = isSameDay(date, today)
    ? "Today"
    : isSameDay(date, yesterday)
      ? "Yesterday"
      : date.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        });

  return `${prefix}, ${timeStr} ${meridiem}`;
};

export default function MyRidesPage() {
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("all");

  useEffect(() => {
    if (!isPending && !sessionData?.session) router.replace("/login");
  }, [isPending, router, sessionData]);

  useEffect(() => {
    if (isPending || !sessionData?.session) return;

    const fetchBookings = async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent ?? false;
      if (isSilent) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      try {
        const response = await fetch("/api/bookings", { cache: "no-store" });
        if (!response.ok) throw new Error();
        setBookings((await response.json()) as Booking[]);
        setError(null);
      } catch {
        // Keep existing cards visible during background refresh failures.
        if (!isSilent) {
          setError("Could not load your rides. Please try again.");
        }
      } finally {
        if (isSilent) {
          setIsRefreshing(false);
        } else {
          setIsInitialLoading(false);
        }
      }
    };

    void fetchBookings();

    const interval = setInterval(() => {
      void fetchBookings({ silent: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [isPending, sessionData?.session?.id]);

  const filtered = useMemo(
    () => bookings.filter((b) => tabMatches(b.status, activeTab)),
    [bookings, activeTab]
  );

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
  };

  if (isPending || !sessionData?.session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-[#5D7490]">Loading your account...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#17324F]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A6FD4] text-white shadow-md">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/user" className={`${montserrat.className} text-3xl font-bold italic tracking-tight text-white`}>
            FlexiGo
          </Link>
          <div className="flex items-center gap-5">
            <span className="hidden text-sm font-semibold text-white/90 sm:block">Download App</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((p) => !p)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/10"
              >
                <span className="flex flex-col gap-1.5">
                  <span className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-200 ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
                  <span className={`h-0.5 w-5 rounded-full bg-white transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : ""}`} />
                  <span className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-200 ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
                </span>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#BFE5FF] bg-white p-3 shadow-xl">
                  <nav className="flex flex-col gap-1">
                    <Link href="/user" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#17324F] hover:bg-[#EAF6FF]">Dashboard</Link>
                    <Link href="/my-rides" onClick={() => setIsMenuOpen(false)} className="rounded-xl bg-[#EAF6FF] px-3 py-2 text-sm font-semibold text-[#0E4A78]">My Rides</Link>
                    <button type="button" className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#17324F] hover:bg-[#EAF6FF]">Support</button>
                  </nav>
                  <div className="mt-3 border-t border-[#DCEEFF] pt-3">
                    <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-70">
                      {isSigningOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 lg:max-w-5xl lg:px-8">
        {/* Page title + filter */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0D1C2E]">My Rides</h1>
            <p className="mt-0.5 text-sm text-[#55687F]">Track and manage all your airport trips</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-[#D4E2F0] bg-white px-4 py-2 text-sm font-semibold text-[#334C68] shadow-sm">
            <span>⚙</span> Filter
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex overflow-x-auto rounded-2xl border border-[#E2EDF6] bg-white shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-b-2 border-[#1A6FD4] text-[#1A6FD4]"
                  : "text-[#55687F] hover:text-[#1A6FD4]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isRefreshing && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D6E8FA] bg-white px-3 py-1.5 text-xs font-medium text-[#5D7490] shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#1A6FD4]" aria-hidden="true" />
            <span>Updating rides...</span>
          </div>
        )}

        {/* Content */}
        {isInitialLoading && bookings.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-[#5D7490]">Loading your rides...</p>
          </div>
        ) : error && bookings.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-3xl border border-[#D8ECFF] bg-white p-10 text-center shadow-sm">
            <span className="text-4xl">⚠️</span>
            <p className="font-bold text-[#102A43]">Something went wrong</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-1 rounded-full border border-[#CFE3FF] bg-white px-5 py-2 text-sm font-semibold text-[#1567D9] hover:bg-[#F4F9FF]">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-3xl border border-[#D8ECFF] bg-white p-10 text-center shadow-sm">
            <span className="text-6xl">✈️</span>
            <p className="text-2xl font-extrabold text-[#0D1C2E]">No rides yet!</p>
            <p className="max-w-xs text-sm text-[#55687F]">
              Looks like you haven&apos;t booked any airport rides yet. Let&apos;s change that!
            </p>
            <Link href="/user" className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] px-8 text-sm font-bold text-white shadow-md transition hover:brightness-105">
              Book Your First Ride 🚀
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ride) => {
              const badge = STATUS_BADGE[ride.status];
              const pickupIsAirport = ride.tripMode === "pickup";
              const dropIsAirport = ride.tripMode === "drop";
              const cardDate = formatCardDate(ride.date, ride.time, ride.meridiem);
              const fullDate = formatSummaryDate(ride.date);
              const displayTime = formatSummaryTime(ride.time, ride.meridiem);
              const isActive = ride.status !== "completed" && ride.status !== "cancelled";
              const daysLeft = isActive ? getDaysRemaining(ride.date) : null;

              return (
                <div key={ride.id} className="overflow-hidden rounded-[20px] border border-[#E2EDF6] bg-white shadow-sm">
                  {/* Card top row */}
                  <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
                    <span className={`inline-flex flex-wrap items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badge.bg} ${badge.color} ${badge.border}`}>
                      <span>{badge.icon}</span>
                      <span className="uppercase tracking-wide">{badge.label}</span>
                      {ride.status === "pending" && <span className="font-normal opacity-80">· Est. wait 4–5 hrs</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-mono text-xs font-bold text-[#55687F]">{ride.confirmationId}</p>
                        <p className="text-[10px] text-[#A0B4C8]">{cardDate}</p>
                      </div>
                      <span className="text-[#B0C4D8]">⋮</span>
                    </div>
                  </div>

                  {/* Route + vehicle panel */}
                  <div className="mt-3 flex items-start gap-4 px-5">
                    {/* Route rows */}
                    <div className="min-w-0 flex-1">
                      {/* Pickup row */}
                      <div className="flex items-start gap-3">
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF4FF] text-base">
                            {pickupIsAirport ? "✈️" : "📍"}
                          </div>
                        </div>
                        <div className="min-w-0 py-1">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1A6FD4]">{ride.pickupLabel}</p>
                          <p className="mt-0.5 text-sm font-bold leading-snug text-[#0D1C2E]">{ride.pickupLocation}</p>
                        </div>
                      </div>
                      {/* Connector */}
                      <div className="ml-[18px] h-5 w-px border-l-2 border-dashed border-[#B5D7FF]" />
                      {/* Drop row */}
                      <div className="flex items-start gap-3">
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF4FF] text-base">
                            {dropIsAirport ? "✈️" : "📍"}
                          </div>
                        </div>
                        <div className="min-w-0 py-1">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1A6FD4]">{ride.dropLabel}</p>
                          <p className="mt-0.5 text-sm font-bold leading-snug text-[#0D1C2E]">{ride.dropLocation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle panel */}
                    <div className="flex w-[110px] shrink-0 flex-col items-center justify-center rounded-2xl border border-[#E8F2FB] bg-[#F6FAFF] px-2 py-3 sm:w-[130px] lg:w-[160px]">
                      {ride.status === "assigned" && ride.driverName ? (
                        <>
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D1E9FF] text-2xl">👤</div>
                          <p className="mt-1 text-center text-xs font-bold text-[#0D1C2E]">{ride.driverName}</p>
                          <p className="mt-0.5 text-xs text-[#7D91A9]">{ride.vehicleLabel}</p>
                        </>
                      ) : (
                        <div className="relative h-14 w-full">
                          <Image
                            src={ride.vehicleImageSrc ?? (ride.vehicleLabel.toLowerCase() === "suv" ? "/SUV-v2.png" : "/Sedan.png")}
                            alt={ride.vehicleLabel}
                            fill
                            unoptimized
                            className="object-contain"
                            sizes="110px"
                          />
                        </div>
                      )}
                      <p className="mt-1 text-xs font-semibold text-[#334C68]">{ride.vehicleLabel}</p>
                      <p className="text-base font-extrabold text-[#0D1C2E]">{formatFare(ride.totalFareCents)}</p>
                      <p className="text-[10px] text-[#7D91A9]">All inclusive</p>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 border-t border-[#EDF3F9] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#55687F]">
                      <span className="flex items-center gap-1.5">
                        <span>📅</span>
                        <span>{fullDate}</span>
                      </span>
                      <span className="text-[#D4E2F0]">|</span>
                      <span className="flex items-center gap-1.5">
                        <span>👤</span>
                        <span>{ride.passengerCount} Passenger{ride.passengerCount > 1 ? "s" : ""}</span>
                      </span>
                      {daysLeft !== null && (
                        <>
                          <span className="text-[#D4E2F0]">|</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            daysLeft < 0
                              ? "bg-[#FEE2E2] text-[#991B1B]"
                              : daysLeft === 0
                                ? "bg-[#FEF3C7] text-[#B45309]"
                                : daysLeft <= 3
                                  ? "bg-[#FEF3C7] text-[#B45309]"
                                  : "bg-[#DBEAFE] text-[#1E40AF]"
                          }`}>
                            <span>🗓</span>
                            {daysLeft < 0
                              ? "Trip passed"
                              : daysLeft === 0
                                ? "Today!"
                                : daysLeft === 1
                                  ? "Tomorrow!"
                                  : `${daysLeft} days away`}
                          </span>
                        </>
                      )}
                    </div>
                    <button type="button" className="flex shrink-0 items-center gap-1 text-sm font-bold text-[#1A6FD4]">
                      View Details <span>→</span>
                    </button>
                  </div>

                  {/* Urgency banners for pending rides close to trip date */}
                  {ride.status === "pending" && daysLeft !== null && daysLeft <= 1 && (
                    <div className={`mx-4 mb-1 mt-3 rounded-2xl border px-4 py-3 text-sm ${
                      daysLeft < 0
                        ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]"
                        : daysLeft === 0
                          ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]"
                          : "border-[#FCD34D] bg-[#FFFBEB] text-[#92400E]"
                    }`}>
                      {daysLeft < 0 ? (
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">Trip date has passed</p>
                            <p className="mt-0.5 text-xs font-normal opacity-80">This ride was not confirmed in time. Please re-book or contact support.</p>
                          </div>
                          <Link href="/user" className="shrink-0 rounded-full border border-[#FCA5A5] bg-white px-3 py-1.5 text-xs font-bold text-[#991B1B] hover:bg-[#FEE2E2]">
                            Re-book
                          </Link>
                        </div>
                      ) : daysLeft === 0 ? (
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">⚠️ Your ride is today — still pending!</p>
                            <p className="mt-0.5 text-xs font-normal opacity-80">Admin has not confirmed yet. Contact support immediately.</p>
                          </div>
                          <a href="mailto:support@flexigo.com" className="shrink-0 rounded-full border border-[#FCA5A5] bg-white px-3 py-1.5 text-xs font-bold text-[#991B1B] hover:bg-[#FEE2E2]">
                            Support
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">⏳ Ride is tomorrow — awaiting confirmation</p>
                            <p className="mt-0.5 text-xs font-normal opacity-80">If not confirmed soon, please reach out to support.</p>
                          </div>
                          <a href="mailto:support@flexigo.com" className="shrink-0 rounded-full border border-[#FCD34D] bg-white px-3 py-1.5 text-xs font-bold text-[#92400E] hover:bg-[#FEF3C7]">
                            Support
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment CTA — urgent variant when trip is today */}
                  {ride.status === "confirmed" && (
                    <div className="border-t border-[#EDF3F9] px-4 pb-4 pt-3">
                      {daysLeft !== null && daysLeft <= 0 && (
                        <p className="mb-2 text-center text-xs font-bold text-[#991B1B]">
                          🚨 {daysLeft === 0 ? "Trip is today" : "Trip date has passed"} — pay now to secure your driver
                        </p>
                      )}
                      <button type="button" className={`inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-bold text-white shadow-md transition hover:brightness-105 ${
                        daysLeft !== null && daysLeft <= 0
                          ? "bg-gradient-to-r from-[#DC2626] to-[#EF4444]"
                          : "bg-gradient-to-r from-[#0B83E9] to-[#38B6FF]"
                      }`}>
                        Pay {formatFare(ride.totalFareCents)} — Complete Booking
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Link href="/user" className="text-sm font-medium text-[#1A6FD4] underline underline-offset-4">
            ← Back to booking
          </Link>
        </div>
      </div>
    </main>
  );
}
