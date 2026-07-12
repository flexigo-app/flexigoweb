"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

type TripMode = "pickup" | "drop";
type FieldKind = "airport" | "address";
type VehicleType = "sedan" | "suv";

type GooglePlacesAutocompletePlace = {
  formatted_address?: string;
  name?: string;
};

type GooglePlacesAutocompleteInstance = {
  getPlace: () => GooglePlacesAutocompletePlace;
  addListener: (event: "place_changed", handler: () => void) => void;
};

type GooglePlacesApi = {
  Autocomplete: new (
    input: HTMLInputElement,
    options: { fields: string[]; types: string[] }
  ) => GooglePlacesAutocompleteInstance;
};

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      places?: GooglePlacesApi;
    };
  };
};

const airportOptions = [
  "John F. Kennedy International Airport (JFK)",
  "Boston Logan International Airport (BOS)",
  "Bradley International Airport (BDL)",
  "Newark Liberty International Airport (EWR)",
];

const passengerOptions = [1, 2, 3, 4, 5, 6];
const vehicleOptions: Array<{
  id: VehicleType;
  label: string;
  passengerRange: string;
  bagLimit: string;
  highlights: string[];
  imageSrc: string;
}> = [
  {
    id: "suv",
    label: "SUV",
    passengerRange: "1 - 6",
    bagLimit: "Up to 6 bags",
    highlights: ["Spacious", "Comfortable", "Extra Luggage"],
    imageSrc: "/SUV-v2.png",
  },
  {
    id: "sedan",
    label: "Sedan",
    passengerRange: "1 - 3",
    bagLimit: "Up to 3 bags",
    highlights: ["Affordable", "Comfortable", "Everyday Rides"],
    imageSrc: "/Sedan.png",
  },
];
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const getTomorrowDateValue = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function UserPage() {
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [tripMode, setTripMode] = useState<TripMode>("pickup");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGreetingCompact, setIsGreetingCompact] = useState(false);
  const [isAirportMenuOpen, setIsAirportMenuOpen] = useState(false);
  const [isPassengerMenuOpen, setIsPassengerMenuOpen] = useState(false);
  const [isPlacesScriptLoaded, setIsPlacesScriptLoaded] = useState(false);
  const [pickupAirport, setPickupAirport] = useState(airportOptions[0]);
  const [dropAirport, setDropAirport] = useState(airportOptions[0]);
  const [selectedPassengerCount, setSelectedPassengerCount] = useState("1");
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>("suv");
  const [selectedDate, setSelectedDate] = useState(getTomorrowDateValue());
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropAddress, setDropAddress] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const airportPickerRef = useRef<HTMLDivElement | null>(null);
  const passengerPickerRef = useRef<HTMLDivElement | null>(null);
  const pickupAddressInputRef = useRef<HTMLInputElement | null>(null);
  const dropAddressInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const pickupAutocompleteRef = useRef<GooglePlacesAutocompleteInstance | null>(null);
  const dropAutocompleteRef = useRef<GooglePlacesAutocompleteInstance | null>(null);
  const pickupBoundInputRef = useRef<HTMLInputElement | null>(null);
  const dropBoundInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isPending && !sessionData?.session) {
      router.replace("/login");
    }
  }, [isPending, router, sessionData]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(targetNode)) {
        setIsMenuOpen(false);
      }

      if (
        airportPickerRef.current &&
        !airportPickerRef.current.contains(targetNode)
      ) {
        setIsAirportMenuOpen(false);
      }

      if (
        passengerPickerRef.current &&
        !passengerPickerRef.current.contains(targetNode)
      ) {
        setIsPassengerMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsAirportMenuOpen(false);
        setIsPassengerMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!googleMapsApiKey || typeof window === "undefined") return;

    const handleScriptReady = () => {
      setIsPlacesScriptLoaded(true);
    };

    const googleWindow = window as GoogleMapsWindow;

    if (googleWindow.google?.maps?.places) {
      queueMicrotask(() => {
        setIsPlacesScriptLoaded(true);
      });
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-places="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", handleScriptReady);
      return () => {
        existingScript.removeEventListener("load", handleScriptReady);
      };
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      googleMapsApiKey
    )}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsPlaces = "true";
    script.addEventListener("load", handleScriptReady);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleScriptReady);
    };
  }, []);

  const bindPlacesAutocomplete = useCallback(
    (
      inputRef: { current: HTMLInputElement | null },
      autocompleteRef: { current: GooglePlacesAutocompleteInstance | null },
      boundInputRef: { current: HTMLInputElement | null },
      onAddressSelect: (value: string) => void
    ) => {
    const googleWindow = window as GoogleMapsWindow;
    const places = googleWindow.google?.maps?.places;
    const input = inputRef.current;

    if (!places || !input || boundInputRef.current === input) return;

    const autocomplete = new places.Autocomplete(input, {
      fields: ["formatted_address", "name"],
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const formattedAddress = place?.formatted_address || input.value;
      onAddressSelect(formattedAddress);
    });

    autocompleteRef.current = autocomplete;
    boundInputRef.current = input;
    },
    []
  );

  useEffect(() => {
    if (!isPlacesScriptLoaded) return;

    bindPlacesAutocomplete(
      pickupAddressInputRef,
      pickupAutocompleteRef,
      pickupBoundInputRef,
      setPickupAddress
    );
    bindPlacesAutocomplete(
      dropAddressInputRef,
      dropAutocompleteRef,
      dropBoundInputRef,
      setDropAddress
    );
  }, [isPlacesScriptLoaded, bindPlacesAutocomplete]);

  const userName = useMemo(() => sessionData?.user?.name || "Traveler", [sessionData]);

  const initials = useMemo(() => {
    const source = (sessionData?.user?.name || "Traveler").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "T";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
  }, [sessionData]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
  };

  const handleTripModeChange = (mode: TripMode) => {
    setTripMode(mode);
    setIsAirportMenuOpen(false);
    setIsPassengerMenuOpen(false);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);

    // Safari keeps date popovers open until blur in some layouts.
    requestAnimationFrame(() => {
      dateInputRef.current?.blur();
    });
  };

  const handleAddressFocus = (side: TripMode) => {
    if (side === "pickup") {
      bindPlacesAutocomplete(
        dropAddressInputRef,
        dropAutocompleteRef,
        dropBoundInputRef,
        setDropAddress
      );
      return;
    }

    bindPlacesAutocomplete(
      pickupAddressInputRef,
      pickupAutocompleteRef,
      pickupBoundInputRef,
      setPickupAddress
    );
  };

  const topField: { label: string; type: FieldKind; placeholder?: string } =
    tripMode === "pickup"
      ? { label: "Pickup (Airport)", type: "airport" }
      : {
          label: "Pickup (Address)",
          type: "address",
          placeholder: "Start typing the pickup address",
        };

  const secondField: { label: string; type: FieldKind; placeholder?: string } =
    tripMode === "pickup"
      ? {
          label: "Drop (Address)",
          type: "address",
          placeholder: "Start typing the drop address",
        }
      : { label: "Drop (Airport)", type: "airport" };

  const renderAirportPicker = (
    currentValue: string,
    onSelect: (value: string) => void
  ) => (
    <div ref={airportPickerRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => {
          setIsAirportMenuOpen((prev) => !prev);
          setIsPassengerMenuOpen(false);
        }}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-[#D6E7F5] bg-white px-4 text-left text-sm text-[#17324F] outline-none transition hover:border-[#B7D8F4] focus:border-[#38B6FF] focus:ring-4 focus:ring-[#38B6FF]/10"
      >
        <span className="truncate">{currentValue}</span>
        <span className="ml-3 text-[#5F7490]">▾</span>
      </button>

      {isAirportMenuOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#BFE5FF] bg-white shadow-2xl">
          {airportOptions.map((airport) => {
            const isActive = airport === currentValue;

            return (
              <button
                key={airport}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  onSelect(airport);
                  setIsAirportMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[#EAF6FF] ${
                  isActive
                    ? "bg-[#EAF6FF] font-semibold text-[#0E4A78]"
                    : "text-[#17324F]"
                }`}
              >
                <span className="pr-3">{airport}</span>
                {isActive ? <span className="text-[#38B6FF]">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  const renderPassengerPicker = () => (
    <div ref={passengerPickerRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => {
          setIsPassengerMenuOpen((prev) => !prev);
          setIsAirportMenuOpen(false);
        }}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-[#D6E7F5] bg-white px-4 text-left text-sm text-[#17324F] outline-none transition hover:border-[#B7D8F4] focus:border-[#38B6FF] focus:ring-4 focus:ring-[#38B6FF]/10"
      >
        <span>
          {selectedPassengerCount} passenger
          {selectedPassengerCount === "1" ? "" : "s"}
        </span>
        <span className="ml-3 text-[#5F7490]">▾</span>
      </button>

      {isPassengerMenuOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#BFE5FF] bg-white shadow-2xl">
          {passengerOptions.map((count) => {
            const value = String(count);
            const isActive = value === selectedPassengerCount;

            return (
              <button
                key={count}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  setSelectedPassengerCount(value);
                  setIsPassengerMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[#EAF6FF] ${
                  isActive
                    ? "bg-[#EAF6FF] font-semibold text-[#0E4A78]"
                    : "text-[#17324F]"
                }`}
              >
                <span>
                  {count} passenger{count > 1 ? "s" : ""}
                </span>
                {isActive ? <span className="text-[#38B6FF]">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  const renderVehicleTypeCards = () => (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {vehicleOptions.map((vehicle) => {
        const isSelected = selectedVehicleType === vehicle.id;

        return (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => setSelectedVehicleType(vehicle.id)}
            className={`group relative overflow-hidden rounded-2xl border bg-white text-left transition focus:outline-none focus:ring-4 focus:ring-[#38B6FF]/15 ${
              isSelected
                ? "border-[#38B6FF] shadow-[0_10px_20px_rgba(56,182,255,0.22)]"
                : "border-[#D6E7F5] hover:border-[#A9D8FF]"
            }`}
            aria-pressed={isSelected}
          >
            <span
              className={`absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition ${
                isSelected
                  ? "border-[#1E88FF] bg-[#1E88FF] text-white"
                  : "border-[#C7D7E6] bg-white text-transparent"
              }`}
            >
              ✓
            </span>

            <div className="relative h-20 w-full bg-[#F4FAFF] px-2 pt-2">
              <Image
                src={vehicle.imageSrc}
                alt={`${vehicle.label} option`}
                fill
                unoptimized
                className="object-contain p-1"
                sizes="(max-width: 640px) 50vw, 20vw"
              />
            </div>

            <div className="px-2.5 py-2">
              <p className="text-base font-semibold leading-none text-[#17324F]">{vehicle.label}</p>

              <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-[#5D7490]">
                <span>{vehicle.passengerRange}</span>
                <span>{vehicle.bagLimit}</span>
              </div>

              <div className="mt-2 rounded-full bg-[#EEF4FA] px-2 py-1 text-[10px] font-semibold text-[#556C86]">
                {vehicle.highlights.join(" • ")}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  if (isPending || !sessionData?.session) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#EAF6FF] text-slate-900">
        <section className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-[#B8E3FF] bg-white px-6 py-4 text-sm font-medium text-slate-900 shadow-sm">
            Loading your account...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EAF6FF] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-[#A6D8FF] bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] shadow-sm">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/user"
            className={`${montserrat.className} text-3xl font-bold italic tracking-tight text-white sm:text-4xl`}
          >
            FlexiGo
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/45 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            >
              <span className="sr-only">Open menu</span>
              <span className="flex flex-col gap-1.5">
                <span
                  className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-200 ${
                    isMenuOpen ? "translate-y-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-5 rounded-full bg-white transition-opacity duration-200 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`h-0.5 w-5 rounded-full bg-white transition-transform duration-200 ${
                    isMenuOpen ? "-translate-y-2 -rotate-45" : ""
                  }`}
                />
              </span>
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-[#BFE5FF] bg-white p-3 shadow-xl">
                <nav className="flex flex-col gap-1">
                  <Link
                    href="/user"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-[#17324F] transition hover:bg-[#EAF6FF]"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#17324F] transition hover:bg-[#EAF6FF]"
                  >
                    My Rides
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#17324F] transition hover:bg-[#EAF6FF]"
                  >
                    Support
                  </button>
                </nav>

                <div className="mt-3 border-t border-[#DCEEFF] pt-3">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="user-dashboard-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:px-8 lg:py-4">
        <div className="w-full">
          <button
            type="button"
            onClick={() => setIsGreetingCompact((prev) => !prev)}
            className={`dashboard-greeting-pill mb-3 inline-flex h-10 items-center gap-2 overflow-hidden rounded-full border border-[#B9E3FF] bg-white px-2 text-[#10416A] shadow-sm transition-all duration-300 ${
              isGreetingCompact ? "w-10" : "w-auto pr-4"
            }`}
          >
            {sessionData?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sessionData.user.image}
                alt="Profile"
                className="h-7 w-7 rounded-full border border-[#BFE5FF] object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] text-xs font-semibold text-white">
                {initials}
              </span>
            )}
            <span
              className={`text-xs font-semibold transition-all duration-300 ${
                isGreetingCompact
                  ? "max-w-0 overflow-hidden opacity-0"
                  : "max-w-[220px] opacity-100"
              }`}
            >
              Hi {userName}
            </span>
          </button>

          <div className="dashboard-booking-card rounded-3xl border border-[#D6ECFF] bg-white p-4 shadow-[0_8px_24px_rgba(10,66,130,0.08)] sm:p-6 lg:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3A8EC6]">
              Connecticut booking
            </p>

            <h2 className="mt-2 max-w-md text-3xl font-extrabold leading-tight text-[#102A43] sm:text-4xl lg:text-[2rem]">
              Reliable Airport Rides from Connecticut
            </h2>
            <p className="mt-2 text-base text-[#355070] sm:text-lg lg:text-base">
              Doorstep pickup. On-time drop. Every time.
            </p>

            <div className="relative mt-4 grid grid-cols-2 rounded-full bg-[#EDF6FF] p-1.5 lg:mt-3">
              <span
                className={`absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] shadow-sm transition-transform duration-300 ease-out ${
                  tripMode === "pickup" ? "translate-x-0" : "translate-x-full"
                }`}
              />
              <button
                type="button"
                onClick={() => handleTripModeChange("pickup")}
                className={`relative z-10 h-11 rounded-full text-sm font-semibold transition-colors ${
                  tripMode === "pickup" ? "text-white" : "text-[#1A3556]"
                }`}
              >
                Airport Pickup
              </button>
              <button
                type="button"
                onClick={() => handleTripModeChange("drop")}
                className={`relative z-10 h-11 rounded-full text-sm font-semibold transition-colors ${
                  tripMode === "drop" ? "text-white" : "text-[#1A3556]"
                }`}
              >
                Airport Drop
              </button>
            </div>

            <div className="mt-4 space-y-4 lg:mt-3 lg:space-y-3">
              <label className="block text-sm font-semibold text-[#1C3553]">
                {topField.label}
                {topField.type === "airport" ? (
                  renderAirportPicker(
                    tripMode === "pickup" ? pickupAirport : dropAirport,
                    tripMode === "pickup" ? setPickupAirport : setDropAirport
                  )
                ) : (
                  <input
                    key={`address-${tripMode}-top`}
                    ref={tripMode === "pickup" ? dropAddressInputRef : pickupAddressInputRef}
                    type="text"
                    value={tripMode === "pickup" ? pickupAddress : dropAddress}
                    onFocus={() => handleAddressFocus(tripMode)}
                    onChange={(event) =>
                      tripMode === "pickup"
                        ? setPickupAddress(event.target.value)
                        : setDropAddress(event.target.value)
                    }
                    placeholder={topField.placeholder}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#D6E7F5] bg-white px-4 text-sm text-[#17324F] outline-none transition placeholder:text-[#7B8DA3] focus:border-[#38B6FF] focus:ring-4 focus:ring-[#38B6FF]/10 lg:h-11"
                  />
                )}
              </label>

              <label className="block text-sm font-semibold text-[#1C3553]">
                {secondField.label}
                {secondField.type === "airport" ? (
                  renderAirportPicker(
                    tripMode === "pickup" ? pickupAirport : dropAirport,
                    tripMode === "pickup" ? setPickupAirport : setDropAirport
                  )
                ) : (
                  <>
                    <input
                      key={`address-${tripMode}-second`}
                      ref={tripMode === "pickup" ? dropAddressInputRef : pickupAddressInputRef}
                      type="text"
                      value={tripMode === "pickup" ? dropAddress : pickupAddress}
                      onFocus={() => handleAddressFocus(tripMode)}
                      onChange={(event) =>
                        tripMode === "pickup"
                          ? setDropAddress(event.target.value)
                          : setPickupAddress(event.target.value)
                      }
                      placeholder={secondField.placeholder}
                      className="mt-2 h-12 w-full rounded-2xl border border-[#D6E7F5] bg-white px-4 text-sm text-[#17324F] outline-none transition placeholder:text-[#7B8DA3] focus:border-[#38B6FF] focus:ring-4 focus:ring-[#38B6FF]/10 lg:h-11"
                    />
                    <p className="mt-2 text-xs font-normal text-[#5D7490] lg:mt-1.5">
                      Google Places autocomplete is enabled here.
                    </p>
                  </>
                )}
              </label>

              <label className="block text-sm font-semibold text-[#1C3553]">
                Date
                <input
                  ref={dateInputRef}
                  type="date"
                  min={getTomorrowDateValue()}
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#D6E7F5] bg-white px-4 text-sm text-[#17324F] outline-none transition focus:border-[#38B6FF] focus:ring-4 focus:ring-[#38B6FF]/10 lg:h-11"
                />
                <p className="mt-2 text-xs font-normal text-[#5D7490] lg:mt-1.5">
                  Today is disabled. Select from tomorrow onward.
                </p>
              </label>

              <label className="block text-sm font-semibold text-[#1C3553]">
                Passenger Count
                {renderPassengerPicker()}
              </label>

              <div className="block">
                <p className="text-sm font-semibold text-[#1C3553]">Choose Your Ride</p>
                <p className="mt-0.5 text-xs font-medium text-[#5D7490]">
                  Select a vehicle that fits your needs
                </p>
                {renderVehicleTypeCards()}
              </div>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] text-lg font-bold text-white shadow-md shadow-[#3AA7EE]/35 transition hover:brightness-105 lg:mt-4 lg:h-11 lg:text-base"
            >
              Book Now
            </button>

            <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:hidden">
              <div className="rounded-xl bg-[#F3FAFF] p-3">
                <p className="text-sm font-semibold text-[#1E3A5C]">Safe</p>
                <p className="mt-1 text-xs text-[#5A708A]">Reliable rides</p>
              </div>
              <div className="rounded-xl bg-[#F3FAFF] p-3">
                <p className="text-sm font-semibold text-[#1E3A5C]">On-time</p>
                <p className="mt-1 text-xs text-[#5A708A]">No delays</p>
              </div>
              <div className="rounded-xl bg-[#F3FAFF] p-3">
                <p className="text-sm font-semibold text-[#1E3A5C]">Pricing</p>
                <p className="mt-1 text-xs text-[#5A708A]">No hidden fees</p>
              </div>
              <div className="rounded-xl bg-[#F3FAFF] p-3">
                <p className="text-sm font-semibold text-[#1E3A5C]">Support</p>
                <p className="mt-1 text-xs text-[#5A708A]">24/7 help</p>
              </div>
            </div>

            <div className="mt-4 lg:mt-3">
              <Link
                href="/"
                className="inline-flex text-sm font-medium text-[#0E4A78] underline underline-offset-4"
              >
                Back to landing page
              </Link>
            </div>
          </div>
        </div>

        <aside className="dashboard-hero-panel relative hidden min-h-[620px] overflow-hidden rounded-[32px] border border-[#BEE4FF] bg-[#1A9AF0] lg:flex lg:min-h-[calc(100vh-8.5rem)] lg:flex-col lg:justify-end">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(160deg, rgba(13,122,220,0.35), rgba(56,182,255,0.25)), url('/user-dashboard-bg.svg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10 p-10 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/85">
              FlexiGo premium
            </p>
            <h3 className="mt-4 max-w-lg text-5xl font-extrabold leading-[1.02] tracking-tight">
              Move faster with scheduled airport transfers that feel first class.
            </h3>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/90">
              Keep the booking card focused and mobile-ready while your desktop
              view carries the brand story with confident visual depth.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
