"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "../_components/admin-shell";

type VehicleConfig = {
  id: string;
  name: string;
  baseFareCents: number;
  perMileCents: number;
  minimumFareCents: number;
  passengerCapacity: number;
  luggageCapacity: number;
  isActive: boolean;
  sortOrder: number;
};

type VehicleForm = {
  name: string;
  baseFare: string;
  perMile: string;
  minimumFare: string;
  passengerCapacity: string;
  luggageCapacity: string;
  sortOrder: string;
};

type PricingPolicy = {
  id: string;
  platformCommissionBps: number;
  bookingFeeCents: number;
  airportAccessFeeCents: number;
  taxRateBps: number;
  fleetDriverTripPayCents: number;
  fleetDriverPerMileCents: number;
  fleetFuelCostPerMileCents: number;
  fleetVehicleReservePerMileCents: number;
  paymentProcessingBps: number;
};

type PricingPolicyForm = {
  platformCommissionPercent: string;
  bookingFee: string;
  airportAccessFee: string;
  taxRatePercent: string;
  fleetDriverTripPay: string;
  fleetDriverPerMile: string;
  fleetFuelCostPerMile: string;
  fleetVehicleReservePerMile: string;
  paymentProcessingPercent: string;
};

type FleetVehicleForm = { vehicleConfigId: string; label: string; make: string; model: string; year: string; vin: string; registrationNumber: string; insurancePolicyNumber: string; insuranceExpiryDate: string };

const emptyForm: VehicleForm = {
  name: "",
  baseFare: "",
  perMile: "",
  minimumFare: "",
  passengerCapacity: "",
  luggageCapacity: "",
  sortOrder: "0",
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

const pricingPolicyForm = (policy: PricingPolicy): PricingPolicyForm => ({
  platformCommissionPercent: (policy.platformCommissionBps / 100).toFixed(2),
  bookingFee: dollars(policy.bookingFeeCents),
  airportAccessFee: dollars(policy.airportAccessFeeCents),
  taxRatePercent: (policy.taxRateBps / 100).toFixed(2),
  fleetDriverTripPay: dollars(policy.fleetDriverTripPayCents),
  fleetDriverPerMile: dollars(policy.fleetDriverPerMileCents),
  fleetFuelCostPerMile: dollars(policy.fleetFuelCostPerMileCents),
  fleetVehicleReservePerMile: dollars(policy.fleetVehicleReservePerMileCents),
  paymentProcessingPercent: (policy.paymentProcessingBps / 100).toFixed(2),
});

const pricingPolicyRequestBody = (form: PricingPolicyForm) => ({
  platformCommissionBps: Math.round(Number(form.platformCommissionPercent) * 100),
  bookingFeeCents: Math.round(Number(form.bookingFee) * 100),
  airportAccessFeeCents: Math.round(Number(form.airportAccessFee) * 100),
  taxRateBps: Math.round(Number(form.taxRatePercent) * 100),
  fleetDriverTripPayCents: Math.round(Number(form.fleetDriverTripPay) * 100),
  fleetDriverPerMileCents: Math.round(Number(form.fleetDriverPerMile) * 100),
  fleetFuelCostPerMileCents: Math.round(Number(form.fleetFuelCostPerMile) * 100),
  fleetVehicleReservePerMileCents: Math.round(Number(form.fleetVehicleReservePerMile) * 100),
  paymentProcessingBps: Math.round(Number(form.paymentProcessingPercent) * 100),
});

function vehicleForm(vehicle: VehicleConfig): VehicleForm {
  return {
    name: vehicle.name,
    baseFare: dollars(vehicle.baseFareCents),
    perMile: dollars(vehicle.perMileCents),
    minimumFare: dollars(vehicle.minimumFareCents),
    passengerCapacity: String(vehicle.passengerCapacity),
    luggageCapacity: String(vehicle.luggageCapacity),
    sortOrder: String(vehicle.sortOrder),
  };
}

function requestBody(form: VehicleForm) {
  return {
    name: form.name.trim(),
    baseFareCents: Math.round(Number(form.baseFare) * 100),
    perMileCents: Math.round(Number(form.perMile) * 100),
    minimumFareCents: Math.round(Number(form.minimumFare) * 100),
    passengerCapacity: Number(form.passengerCapacity),
    luggageCapacity: Number(form.luggageCapacity),
    sortOrder: Number(form.sortOrder),
  };
}

export function FleetPricingClient() {
  const [vehicles, setVehicles] = useState<VehicleConfig[]>([]);
  const [forms, setForms] = useState<Record<string, VehicleForm>>({});
  const [newVehicle, setNewVehicle] = useState<VehicleForm>(emptyForm);
  const [pricingPolicy, setPricingPolicy] = useState<PricingPolicy | null>(null);
  const [pricingPolicyFormState, setPricingPolicyFormState] = useState<PricingPolicyForm | null>(null);
  const [isAddingFleetVehicle, setIsAddingFleetVehicle] = useState(false);
  const [fleetVehicleForm, setFleetVehicleForm] = useState<FleetVehicleForm>({ vehicleConfigId: "", label: "", make: "", model: "", year: "", vin: "", registrationNumber: "", insurancePolicyNumber: "", insuranceExpiryDate: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const [vehiclesResponse, pricingResponse] = await Promise.all([
          fetch("/api/admin/vehicle-config", { cache: "no-store" }),
          fetch("/api/admin/pricing-policy", { cache: "no-store" }),
        ]);
        if (!vehiclesResponse.ok || !pricingResponse.ok) throw new Error("Unable to load pricing configuration.");
        const data = (await vehiclesResponse.json()) as VehicleConfig[];
        const policy = (await pricingResponse.json()) as PricingPolicy;
        setVehicles(data);
        setForms(Object.fromEntries(data.map((vehicle) => [vehicle.id, vehicleForm(vehicle)])));
        setPricingPolicy(policy);
        setPricingPolicyFormState(pricingPolicyForm(policy));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load vehicle configuration.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadVehicles();
  }, []);

  const updateForm = (id: string, field: keyof VehicleForm, value: string) => {
    setForms((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const savePricingPolicy = async () => {
    if (!pricingPolicyFormState) return;
    setSavingId("policy");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/pricing-policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricingPolicyRequestBody(pricingPolicyFormState)),
      });
      const data = (await response.json()) as PricingPolicy | { message?: string };
      if (!response.ok) throw new Error("message" in data ? data.message : "Unable to save pricing policy.");
      const updated = data as PricingPolicy;
      setPricingPolicy(updated);
      setPricingPolicyFormState(pricingPolicyForm(updated));
      setMessage("Platform pricing policy saved. It will apply to new ride requests.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save pricing policy.");
    } finally {
      setSavingId(null);
    }
  };

  const saveVehicle = async (vehicle: VehicleConfig) => {
    setSavingId(vehicle.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/vehicle-config/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody(forms[vehicle.id])),
      });
      const data = (await response.json()) as VehicleConfig | { message?: string };
      if (!response.ok) throw new Error("message" in data ? data.message : "Unable to save vehicle.");
      const updated = data as VehicleConfig;
      setVehicles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setForms((current) => ({ ...current, [updated.id]: vehicleForm(updated) }));
      setMessage(`${updated.name} saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save vehicle.");
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (vehicle: VehicleConfig) => {
    setSavingId(vehicle.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/vehicle-config/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      });
      const data = (await response.json()) as VehicleConfig | { message?: string };
      if (!response.ok) throw new Error("message" in data ? data.message : "Unable to update vehicle.");
      const updated = data as VehicleConfig;
      setVehicles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(updated.isActive ? `${updated.name} is available for booking.` : `${updated.name} is no longer available for new bookings.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update vehicle.");
    } finally {
      setSavingId(null);
    }
  };

  const addVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingId("new");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/vehicle-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody(newVehicle)),
      });
      const data = (await response.json()) as VehicleConfig | { message?: string };
      if (!response.ok) throw new Error("message" in data ? data.message : "Unable to add vehicle.");
      const created = data as VehicleConfig;
      setVehicles((current) => [...current, created].sort((first, second) => first.sortOrder - second.sortOrder));
      setForms((current) => ({ ...current, [created.id]: vehicleForm(created) }));
      setNewVehicle(emptyForm);
      setIsAdding(false);
      setMessage(`${created.name} added to the catalog.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add vehicle.");
    } finally {
      setSavingId(null);
    }
  };

  const addFleetVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingId("fleet-vehicle");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/fleet-vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fleetVehicleForm, year: Number(fleetVehicleForm.year) }) });
      const data = (await response.json()) as { label?: string; message?: string };
      if (!response.ok) throw new Error(data.message ?? "Unable to add fleet vehicle.");
      setFleetVehicleForm({ vehicleConfigId: "", label: "", make: "", model: "", year: "", vin: "", registrationNumber: "", insurancePolicyNumber: "", insuranceExpiryDate: "" });
      setIsAddingFleetVehicle(false);
      setMessage(`${data.label} added to the FlexiGo fleet.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add fleet vehicle.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminShell activeHref="/admin/fleet-pricing" title="Fleet & Pricing" subtitle="Set the vehicles customers can book and the fares used for every new ride.">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm text-slate-600">Rates are stored in dollars here and calculated in cents on the server. Deactivated vehicles remain on historical rides but disappear from new customer bookings.</p>
          {message ? <p className="mt-3 text-sm font-medium text-slate-700" role="status">{message}</p> : null}
        </div>
        <button type="button" onClick={() => setIsAdding((open) => !open)} className="h-10 rounded-lg bg-[#1A6FD4] px-4 text-sm font-bold text-white transition hover:bg-blue-700">
          {isAdding ? "Close form" : "Add vehicle"}
        </button>
      </section>

      {isAdding ? (
        <form onSubmit={addVehicle} className="mt-5 border border-blue-200 bg-blue-50 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">New vehicle type</h2>
            <button type="submit" disabled={savingId === "new"} className="h-9 rounded-lg bg-[#1A6FD4] px-4 text-sm font-bold text-white disabled:opacity-60">
              {savingId === "new" ? "Adding..." : "Add vehicle"}
            </button>
          </div>
          <VehicleFields form={newVehicle} onChange={(field, value) => setNewVehicle((current) => ({ ...current, [field]: value }))} />
        </form>
      ) : null}

      <section className="mt-5 border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Platform economics</h2>
            <p className="mt-1 text-sm text-slate-600">Commission is retained from the trip fare. Airport access is reimbursed to the driver; booking fees and tax are excluded from the driver payout.</p>
          </div>
          <button type="button" disabled={!pricingPolicy || savingId === "policy"} onClick={() => void savePricingPolicy()} className="h-9 bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60">
            {savingId === "policy" ? "Saving..." : "Save policy"}
          </button>
        </div>
        {pricingPolicyFormState ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PolicyField label="FlexiGo commission (%)" value={pricingPolicyFormState.platformCommissionPercent} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, platformCommissionPercent: value } : current)} />
            <PolicyField label="Booking fee ($)" value={pricingPolicyFormState.bookingFee} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, bookingFee: value } : current)} />
            <PolicyField label="Airport access fee ($)" value={pricingPolicyFormState.airportAccessFee} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, airportAccessFee: value } : current)} />
            <PolicyField label="Tax rate (%)" value={pricingPolicyFormState.taxRatePercent} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, taxRatePercent: value } : current)} />
          </div>
        ) : <p className="mt-4 text-sm text-slate-500">Loading platform pricing policy...</p>}
        <p className="mt-3 text-xs text-slate-500">Airport access fee applies once to any trip that starts or ends at an airport. Use a verified local rate before enabling tax.</p>
      </section>

      <section className="mt-5 border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">FlexiGo fleet operations</h2>
            <p className="mt-1 text-sm text-slate-600">These rates are used only after an admin assigns a pending ride to a FlexiGo fleet vehicle.</p>
          </div>
          <button type="button" disabled={!pricingPolicy || savingId === "policy"} onClick={() => void savePricingPolicy()} className="h-9 bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60">{savingId === "policy" ? "Saving..." : "Save fleet rates"}</button>
        </div>
        {pricingPolicyFormState ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <PolicyField label="Driver trip pay ($)" value={pricingPolicyFormState.fleetDriverTripPay} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, fleetDriverTripPay: value } : current)} />
          <PolicyField label="Driver per mile ($)" value={pricingPolicyFormState.fleetDriverPerMile} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, fleetDriverPerMile: value } : current)} />
          <PolicyField label="Fuel per mile ($)" value={pricingPolicyFormState.fleetFuelCostPerMile} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, fleetFuelCostPerMile: value } : current)} />
          <PolicyField label="Vehicle reserve per mile ($)" value={pricingPolicyFormState.fleetVehicleReservePerMile} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, fleetVehicleReservePerMile: value } : current)} />
          <PolicyField label="Processing rate (%)" value={pricingPolicyFormState.paymentProcessingPercent} onChange={(value) => setPricingPolicyFormState((current) => current ? { ...current, paymentProcessingPercent: value } : current)} />
        </div> : null}
        <div className="mt-5 border-t border-slate-200 pt-4">
          <button type="button" onClick={() => setIsAddingFleetVehicle((open) => !open)} className="h-9 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{isAddingFleetVehicle ? "Close vehicle form" : "Add FlexiGo vehicle"}</button>
          {isAddingFleetVehicle ? <form onSubmit={addFleetVehicle} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">Vehicle category<select required value={fleetVehicleForm.vehicleConfigId} onChange={(event) => setFleetVehicleForm((current) => ({ ...current, vehicleConfigId: event.target.value }))} className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm"><option value="">Select category</option>{vehicles.filter((vehicle) => vehicle.isActive).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>
            {(["label", "make", "model", "year", "vin", "registrationNumber", "insurancePolicyNumber", "insuranceExpiryDate"] as const).map((field) => <label key={field} className="text-xs font-semibold text-slate-600">{field === "registrationNumber" ? "Registration" : field === "insurancePolicyNumber" ? "Insurance policy" : field === "insuranceExpiryDate" ? "Insurance expiry (YYYY-MM-DD)" : field.charAt(0).toUpperCase() + field.slice(1)}<input required value={fleetVehicleForm[field]} onChange={(event) => setFleetVehicleForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm" /></label>)}
            <button type="submit" disabled={savingId === "fleet-vehicle"} className="h-10 bg-[#1A6FD4] px-4 text-sm font-bold text-white disabled:opacity-60">{savingId === "fleet-vehicle" ? "Adding..." : "Add vehicle"}</button>
          </form> : null}
        </div>
      </section>

      <section className="mt-5 overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <h2 className="text-base font-bold text-slate-900">Bookable vehicle catalog</h2>
        </div>
        {isLoading ? <p className="p-5 text-sm text-slate-500">Loading vehicle configuration...</p> : null}
        {!isLoading && vehicles.length === 0 ? <p className="p-5 text-sm text-slate-500">No vehicle types are configured.</p> : null}
        <div className="divide-y divide-slate-200">
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className={`p-4 sm:p-5 ${vehicle.isActive ? "" : "bg-slate-50"}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{vehicle.name}</h3>
                  <span className={`border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${vehicle.isActive ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-100 text-slate-600"}`}>
                    {vehicle.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={savingId === vehicle.id} onClick={() => void toggleActive(vehicle)} className="h-9 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    {vehicle.isActive ? "Deactivate" : "Restore"}
                  </button>
                  <button type="button" disabled={savingId === vehicle.id} onClick={() => void saveVehicle(vehicle)} className="h-9 bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60">
                    {savingId === vehicle.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
              <VehicleFields form={forms[vehicle.id] ?? vehicleForm(vehicle)} onChange={(field, value) => updateForm(vehicle.id, field, value)} />
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function PolicyField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <input required type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#1A6FD4] focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}

function VehicleFields({ form, onChange }: { form: VehicleForm; onChange: (field: keyof VehicleForm, value: string) => void }) {
  const fields: { field: keyof VehicleForm; label: string; step?: string; minimum?: string }[] = [
    { field: "name", label: "Vehicle name" },
    { field: "baseFare", label: "Base fare ($)", step: "0.01", minimum: "0" },
    { field: "perMile", label: "Per mile ($)", step: "0.01", minimum: "0" },
    { field: "minimumFare", label: "Minimum fare ($)", step: "0.01", minimum: "0" },
    { field: "passengerCapacity", label: "Passengers", step: "1", minimum: "1" },
    { field: "luggageCapacity", label: "Luggage", step: "1", minimum: "0" },
    { field: "sortOrder", label: "Display order", step: "1", minimum: "0" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {fields.map(({ field, label, step, minimum }) => (
        <label key={field} className="block text-xs font-semibold text-slate-600">
          {label}
          <input
            required
            type={field === "name" ? "text" : "number"}
            min={minimum}
            step={step}
            value={form[field]}
            onChange={(event) => onChange(field, event.target.value)}
            className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#1A6FD4] focus:ring-2 focus:ring-blue-100"
          />
        </label>
      ))}
    </div>
  );
}