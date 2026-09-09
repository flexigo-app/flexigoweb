"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../_components/admin-shell";

type DriverStatus = "available" | "busy" | "offline";

type Driver = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  registrationNumber: string | null;
  vehicleType: string | null;
  vehicleLabel: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: string | null;
  profileImage: string | null;
  status: DriverStatus;
  homeCity: string;
  notes: string | null;
  assignedRideCount: number;
};

type DriverFilter = "all" | DriverStatus;

const statusStyles: Record<DriverStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-300",
  busy: "bg-amber-50 text-amber-700 border-amber-300",
  offline: "bg-slate-100 text-slate-700 border-slate-300",
};

export function AdminDriversClient() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DriverFilter>("all");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/drivers", { cache: "no-store" });
        if (!res.ok) throw new Error();
        setDrivers((await res.json()) as Driver[]);
      } catch {
        setError("Unable to load drivers right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const filteredDrivers = useMemo(() => {
    return filter === "all" ? drivers : drivers.filter((driver) => driver.status === filter);
  }, [drivers, filter]);

  const stats = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter((driver) => driver.status === "available").length,
      busy: drivers.filter((driver) => driver.status === "busy").length,
      offline: drivers.filter((driver) => driver.status === "offline").length,
    };
  }, [drivers]);

  return (
    <AdminShell
      activeHref="/admin/drivers"
      title="Driver Management"
      subtitle="Manage licensed driver availability and compliance; vehicles are assigned per ride."
      showBackButton
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Total Drivers", value: stats.total },
          { label: "Available", value: stats.available },
          { label: "Busy", value: stats.busy },
          { label: "Offline", value: stats.offline },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Fleet Roster</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "available", "busy", "offline"] as DriverFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  filter === value
                    ? "border-[#1A6FD4] bg-blue-50 text-[#1A6FD4]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : isLoading ? (
          <div className="mt-4 text-sm text-slate-500">Loading drivers...</div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {filteredDrivers.map((driver) => (
              <article key={driver.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {driver.profileImage ? (
                      <Image
                        src={driver.profileImage}
                        alt={driver.name}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl font-bold text-slate-400">
                        {driver.name.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{driver.name}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusStyles[driver.status]}`}>
                        {driver.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{driver.email}</p>
                    <p className="text-sm text-slate-600">{driver.phoneNumber}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">License</p>
                    <p className="text-sm font-semibold text-slate-800">{driver.licenseNumber}</p>
                  </div>
                  {driver.vehicleLabel ? <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Driver-owned vehicle</p>
                    <p className="text-sm font-semibold text-slate-800">{driver.vehicleLabel}</p>
                  </div> : <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vehicle</p>
                    <p className="text-sm font-semibold text-slate-500">Assigned per ride</p>
                  </div>}
                  {driver.insuranceExpiryDate ? <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Driver-owned insurance</p>
                    <p className="text-sm font-semibold text-slate-800">{driver.insuranceExpiryDate}</p>
                  </div> : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Assigned rides</p>
                    <p className="text-lg font-extrabold text-slate-900">{driver.assignedRideCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Base city</p>
                    <p className="text-sm font-semibold text-slate-800">{driver.homeCity}</p>
                  </div>
                </div>

                {driver.notes ? (
                  <p className="mt-3 text-sm text-slate-600">{driver.notes}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}