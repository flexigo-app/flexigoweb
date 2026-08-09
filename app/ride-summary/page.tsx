"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bookingSummaryStorageKey,
  calculateFare,
  formatSummaryDate,
  formatSummaryTime,
  type BookingSummary,
} from "@/lib/booking-summary";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

const formatRideTypeLabel = (vehicleLabel: string) => vehicleLabel;

export default function RideSummaryPage() {
  const router = useRouter();
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [isSummaryReady, setIsSummaryReady] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    const storedSummary = window.sessionStorage.getItem(bookingSummaryStorageKey);
    if (!storedSummary) {
      setIsSummaryReady(true);
      router.replace("/user");
      return;
    }

    try {
      setBookingSummary(JSON.parse(storedSummary) as BookingSummary);
    } catch {
      router.replace("/user");
    } finally {
      setIsSummaryReady(true);
    }
  }, [router]);

  useEffect(() => {
    if (isSummaryReady && !bookingSummary) {
      router.replace("/user");
    }
  }, [bookingSummary, isSummaryReady, router]);

  const summaryDate = useMemo(
    () => formatSummaryDate(bookingSummary?.date || ""),
    [bookingSummary]
  );

  const summaryTime = useMemo(
    () =>
      bookingSummary
        ? formatSummaryTime(bookingSummary.time, bookingSummary.meridiem)
        : "",
    [bookingSummary]
  );

  const totalFare = useMemo(
    () =>
      bookingSummary
        ? calculateFare(bookingSummary.vehicleType, bookingSummary.routeDistanceMeters ?? 0)
        : 0,
    [bookingSummary]
  );

  const handleRequestRide = async () => {
    if (!bookingSummary || isConfirming || confirmationId) return;
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingSummary),
      });

      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        setConfirmError(err.message ?? "Booking failed. Please try again.");
        return;
      }

      const data = (await response.json()) as { confirmationId: string };
      setConfirmationId(data.confirmationId);
      window.sessionStorage.removeItem("flexigo-booking-summary");
      router.push("/my-rides");
    } catch {
      setConfirmError("Network error. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRequestRideClick = () => {
    if (isConfirming || confirmationId) return;
    setIsRequestModalOpen(true);
  };

  const pickupIsAirport = bookingSummary ? bookingSummary.tripMode === "pickup" : false;
  const dropIsAirport = bookingSummary ? bookingSummary.tripMode === "drop" : false;

  if (!isSummaryReady || !bookingSummary) {
    return (
      <main className="min-h-screen bg-[#EAF6FF] px-4 py-10 text-[#17324F]">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center rounded-3xl border border-[#D8ECFF] bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-[#5D7490]">Loading ride summary...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EAF6FF] text-[#17324F]">
      <header className="sticky top-0 z-30 border-b border-[#B6DBFF] bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/user" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-xl">
              ←
            </span>
            <span className={`${montserrat.className} text-3xl font-bold italic tracking-tight`}>
              FlexiGo
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <span className="text-sm font-semibold text-white/90">Download App</span>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/35 bg-white/10 text-white"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="relative overflow-hidden rounded-[30px] bg-white shadow-[0_18px_60px_rgba(10,66,130,0.08)]">
          <div
            className="absolute inset-0 opacity-95"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(14,107,206,0.08), rgba(56,182,255,0.06)), url('/user-dashboard-bg.svg')",
              backgroundSize: "cover",
              backgroundPosition: "center right",
            }}
          />

          <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#102A43] sm:text-4xl">
                Ride Summary
              </h1>
              <p className="mt-2 text-base font-medium text-[#55687F] sm:text-lg">
                Review your trip details and fare estimate
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-5">
                <section className="overflow-hidden rounded-[26px] border border-[#D9ECFF] bg-white/95 p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF4FF] text-2xl text-[#1567D9]">
                        {pickupIsAirport ? "✈" : "📍"}
                      </div>
                      <div className="my-2 h-10 w-px border-l-2 border-dashed border-[#B5D7FF]" />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF4FF] text-2xl text-[#1567D9]">
                        {dropIsAirport ? "✈" : "📍"}
                      </div>
                    </div>

                    <div className="flex-1 space-y-5">
                      <div>
                        <p className="text-sm font-semibold text-[#1567D9]">{bookingSummary.pickupLabel}</p>
                        <h2 className="mt-1 text-lg font-extrabold leading-snug text-[#102A43] sm:text-xl">
                          {bookingSummary.pickupLocation}
                        </h2>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#1567D9]">{bookingSummary.dropLabel}</p>
                        <h2 className="mt-1 text-lg font-extrabold leading-snug text-[#102A43] sm:text-xl">
                          {bookingSummary.dropLocation}
                        </h2>
                      </div>
                    </div>

                    <div className="hidden shrink-0 md:block">
                      <Link
                        href="/user"
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#CFE3FF] bg-white px-4 py-3 text-sm font-semibold text-[#1567D9] shadow-sm transition hover:bg-[#F4F9FF]"
                      >
                        <span>✎</span>
                        <span>Edit</span>
                      </Link>
                    </div>
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#D9ECFF] bg-white/95 p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-extrabold text-[#102A43]">Trip Details</h2>
                    <Link
                      href="/user"
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#CFE3FF] bg-white px-4 py-3 text-sm font-semibold text-[#1567D9] shadow-sm transition hover:bg-[#F4F9FF]"
                    >
                      <span>✎</span>
                      <span>Edit</span>
                    </Link>
                  </div>

                  <div className="mt-4 divide-y divide-[#E6F1FB]">
                    {[
                      ["Date", summaryDate],
                      ["Time", summaryTime],
                      ["Passenger(s)", `${bookingSummary.passengerCount} Passenger${bookingSummary.passengerCount === "1" ? "" : "s"}`],
                      ["Ride Type", formatRideTypeLabel(bookingSummary.vehicleLabel)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 text-[#334C68]">
                          <span className="text-lg text-[#1567D9]">•</span>
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#102A43]">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-[26px] border border-[#D9ECFF] bg-white/95 p-5 shadow-sm sm:p-6">
                  <h2 className="text-2xl font-extrabold text-[#102A43]">Ride Estimate</h2>

                  <div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                    <div className="overflow-hidden rounded-2xl border border-[#E2EEF9] bg-[#F6FAFF] p-3">
                      <div className="relative h-28 w-full sm:h-32">
                        <Image
                          src={bookingSummary.vehicleImageSrc}
                          alt={`${bookingSummary.vehicleLabel} vehicle`}
                          fill
                          unoptimized
                          className="object-contain"
                          sizes="180px"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-[#102A43]">
                        {bookingSummary.vehicleLabel}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-[#1C3553]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF5FF] px-3 py-1">
                          <span aria-hidden="true">👥</span>
                          <span>{bookingSummary.passengerRange}</span>
                        </span>
                        <span className="rounded-full bg-[#EEF5FF] px-3 py-1">{bookingSummary.bagLimit}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bookingSummary.vehicleHighlights.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-[#EAF4FF] px-3 py-1 text-xs font-semibold text-[#1567D9]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#E8F2FB] bg-[#FBFDFF] p-4 text-center text-sm font-medium text-[#334C68]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[#7D91A9]">Distance</p>
                      <p className="mt-1 font-semibold text-[#102A43]">
                        {bookingSummary.routeDistanceText || "Unavailable"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[#7D91A9]">Est. Duration</p>
                      <p className="mt-1 font-semibold text-[#102A43]">
                        {bookingSummary.routeDurationText || "Unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#F2FAF4] px-4 py-3 text-center text-sm font-semibold text-[#2D7C55]">
                    Tolls & taxes included • No hidden fees
                  </div>

                  <div className="mt-5 rounded-[22px] border border-[#E2EEF9] bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#334C68]">Total Fare</p>
                        <p className="text-xs text-[#7A8EA7]">All inclusive</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-extrabold text-[#102A43]">${totalFare.toFixed(2)}</p>
                        <span className="inline-flex rounded-lg bg-[#EEF5FF] px-2 py-1 text-xs font-bold text-[#334C68]">USD</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#D9ECFF] bg-[#F7FBFF] px-5 py-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                    {[
                      ["Safe & Reliable", "Your safety is our priority"],
                      ["On-Time Every Time", "Punctual rides, no delays"],
                      ["Affordable Pricing", "Transparent & no hidden fees"],
                      ["24/7 Support", "We’re here whenever you need"],
                    ].map(([title, subtitle]) => (
                      <div key={title} className="rounded-2xl bg-white px-3 py-4 shadow-sm">
                        <p className="text-sm font-semibold text-[#102A43]">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#55687F]">{subtitle}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRequestRideClick}
                disabled={isConfirming || !!confirmationId}
                className="inline-flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#0B83E9] via-[#1A8AF4] to-[#38B6FF] px-6 text-lg font-bold text-white shadow-[0_14px_32px_rgba(56,182,255,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[240px]"
              >
                {isConfirming ? "Requesting..." : confirmationId ? "Requested ✓" : "Request Ride"}
              </button>
              <Link
                href="/user"
                className="inline-flex h-14 w-full items-center justify-center rounded-full border border-[#CFE3FF] bg-white px-6 text-lg font-bold text-[#1567D9] shadow-sm transition hover:bg-[#F4F9FF] sm:w-auto sm:min-w-[180px]"
              >
                Edit Trip
              </Link>
            </div>

            {isRequestModalOpen ? (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B2038]/55 px-4">
                <div className="w-full max-w-md rounded-3xl border border-[#D6E8FA] bg-white p-6 shadow-[0_30px_80px_rgba(16,42,67,0.35)]">
                  <h3 className="text-xl font-extrabold text-[#102A43]">Raise Ride Request</h3>
                  <p className="mt-2 text-sm font-medium text-[#55687F]">
                    Are you sure you want to raise a ride request?
                  </p>
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRequestModalOpen(false)}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-[#CFE3FF] bg-white px-4 text-sm font-bold text-[#1567D9] hover:bg-[#F4F9FF]"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsRequestModalOpen(false);
                        await handleRequestRide();
                      }}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] px-4 text-sm font-bold text-white hover:brightness-105"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {confirmationId ? (
              <div className="mt-4 rounded-2xl border border-[#CDE8D0] bg-[#F2FAF4] px-5 py-4">
                <p className="text-sm font-bold text-[#2D7C55]">Ride Requested!</p>
                <p className="mt-1 text-sm text-[#3A7A5A]">
                  Your confirmation ID is{" "}
                  <span className="font-mono font-bold tracking-wide">{confirmationId}</span>.
                  Save this for your records.
                </p>
              </div>
            ) : null}
            {confirmError ? (
              <div className="mt-4 rounded-2xl border border-[#F5CBCB] bg-[#FFF5F5] px-5 py-4 text-sm font-semibold text-[#C0392B]">
                {confirmError}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
