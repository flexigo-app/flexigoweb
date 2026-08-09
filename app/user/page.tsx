"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  bookingSummaryStorageKey,
  type BookingSummary,
  type TripMode,
  type VehicleType,
  readBookingSummaryFromStorage,
} from "@/lib/booking-summary";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

type FieldKind = "airport" | "address";
type BookingErrorState = {
  topField?: string;
  secondField?: string;
  selectedDate?: string;
  selectedTime?: string;
  selectedPassengerCount?: string;
  selectedVehicleType?: string;
};

type AddressSuggestion = {
  placeId: string;
  formattedAddress: string;
  stateCode: string;
};

type GooglePlacesAutocompletePlace = {
  formatted_address?: string;
  place_id?: string;
  address_components?: Array<{
    short_name?: string;
    types?: string[];
  }>;
};

type GooglePlacesAutocompleteInstance = {
  getPlace: () => GooglePlacesAutocompletePlace;
  addListener: (event: "place_changed", handler: () => void) => void;
};

type GooglePlacesApi = {
  Autocomplete: new (
    input: HTMLInputElement,
    options: {
      fields: string[];
      types: string[];
      componentRestrictions?: {
        country: string;
      };
    }
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

const airportRouteLocationByLabel: Record<string, string> = {
  "John F. Kennedy International Airport (JFK)":
    "John F. Kennedy International Airport, Queens, NY 11430, USA",
  "Boston Logan International Airport (BOS)":
    "Boston Logan International Airport, Boston, MA 02128, USA",
  "Bradley International Airport (BDL)":
    "Bradley International Airport, Windsor Locks, CT 06096, USA",
  "Newark Liberty International Airport (EWR)":
    "Newark Liberty International Airport, Newark, NJ 07114, USA",
};

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
const allowedAddressStateCodes = new Set(["CT", "MA"]);

const getTomorrowDateValue = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getBookingDefaultsFromSummary = (summary: BookingSummary | null) => {
  if (!summary) return null;

  return {
    tripMode: summary.tripMode,
    pickupAirport: summary.pickupAirport,
    dropAirport: summary.dropAirport,
    pickupAddress: summary.pickupAddress,
    dropAddress: summary.dropAddress,
    pickupAddressPlaceId: summary.pickupAddressPlaceId,
    dropAddressPlaceId: summary.dropAddressPlaceId,
    selectedPassengerCount: summary.passengerCount,
    selectedVehicleType: summary.vehicleType,
    selectedDate: summary.date,
    selectedTime: summary.time,
    selectedMeridiem: summary.meridiem,
  };
};

export default function UserPage() {
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();
  const storedBookingSummary = useMemo(() => readBookingSummaryFromStorage(), []);
  const bookingDefaults = useMemo(
    () => getBookingDefaultsFromSummary(storedBookingSummary),
    [storedBookingSummary]
  );

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [tripMode, setTripMode] = useState<TripMode>(bookingDefaults?.tripMode ?? "pickup");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGreetingCompact, setIsGreetingCompact] = useState(false);
  const [isAirportMenuOpen, setIsAirportMenuOpen] = useState(false);
  const [isPassengerMenuOpen, setIsPassengerMenuOpen] = useState(false);
  const [isPlacesScriptLoaded, setIsPlacesScriptLoaded] = useState(false);
  const [useGooglePlacesFallback, setUseGooglePlacesFallback] = useState(false);
  const [pickupAirport, setPickupAirport] = useState(
    bookingDefaults?.pickupAirport ?? airportOptions[0]
  );
  const [dropAirport, setDropAirport] = useState(
    bookingDefaults?.dropAirport ?? airportOptions[0]
  );
  const [selectedPassengerCount, setSelectedPassengerCount] = useState(
    bookingDefaults?.selectedPassengerCount ?? "1"
  );
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>(
    bookingDefaults?.selectedVehicleType ?? "suv"
  );
  const [selectedDate, setSelectedDate] = useState(
    bookingDefaults?.selectedDate ?? getTomorrowDateValue()
  );
  const [selectedTime, setSelectedTime] = useState(bookingDefaults?.selectedTime ?? "");
  const [selectedMeridiem, setSelectedMeridiem] = useState<"AM" | "PM">(
    bookingDefaults?.selectedMeridiem ?? "AM"
  );
  const [pickupAddress, setPickupAddress] = useState(bookingDefaults?.pickupAddress ?? "");
  const [dropAddress, setDropAddress] = useState(bookingDefaults?.dropAddress ?? "");
  const [pickupAddressPlaceId, setPickupAddressPlaceId] = useState(
    bookingDefaults?.pickupAddressPlaceId ?? ""
  );
  const [dropAddressPlaceId, setDropAddressPlaceId] = useState(
    bookingDefaults?.dropAddressPlaceId ?? ""
  );
  const [pickupAddressStateCode, setPickupAddressStateCode] = useState("");
  const [dropAddressStateCode, setDropAddressStateCode] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<AddressSuggestion[]>([]);
  const [isPickupSuggestionsOpen, setIsPickupSuggestionsOpen] = useState(false);
  const [isDropSuggestionsOpen, setIsDropSuggestionsOpen] = useState(false);
  const [pickupSuggestionsLoading, setPickupSuggestionsLoading] = useState(false);
  const [dropSuggestionsLoading, setDropSuggestionsLoading] = useState(false);
  const [bookingErrors, setBookingErrors] = useState<BookingErrorState>({});
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [dismissedFinalBookings, setDismissedFinalBookings] = useState<Set<string>>(
    new Set()
  );

  const menuRef = useRef<HTMLDivElement | null>(null);
  const airportPickerRef = useRef<HTMLDivElement | null>(null);
  const passengerPickerRef = useRef<HTMLDivElement | null>(null);
  const topFieldSectionRef = useRef<HTMLLabelElement | null>(null);
  const secondFieldSectionRef = useRef<HTMLLabelElement | null>(null);
  const scheduleSectionRef = useRef<HTMLDivElement | null>(null);
  const passengerSectionRef = useRef<HTMLLabelElement | null>(null);
  const vehicleSectionRef = useRef<HTMLDivElement | null>(null);
  const pickupAddressInputRef = useRef<HTMLInputElement | null>(null);
  const dropAddressInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const vehicleCardsRef = useRef<HTMLDivElement | null>(null);
  const passengerButtonRef = useRef<HTMLButtonElement | null>(null);
  const pickupAutocompleteRef = useRef<GooglePlacesAutocompleteInstance | null>(null);
  const dropAutocompleteRef = useRef<GooglePlacesAutocompleteInstance | null>(null);
  const pickupBoundInputRef = useRef<HTMLInputElement | null>(null);
  const dropBoundInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isPending && !sessionData?.session) {
      router.replace("/login");
    }
  }, [isPending, router, sessionData]);

  // Fetch recent bookings for notifications
  useEffect(() => {
    if (!sessionData?.session) return;

    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      try {
        const response = await fetch("/api/bookings");
        if (response.ok) {
          const bookings = (await response.json()) as any[];
          // Get the 6 most recent bookings (sorted by createdAt descending)
          setRecentBookings(bookings.slice(0, 6));
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchBookings();
    // Refetch bookings every 30 seconds
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [sessionData?.session]);

  // Auto-dismiss completed/cancelled bookings after 5 seconds
  useEffect(() => {
    const finalStatuses = ["completed", "cancelled"];
    const timers: NodeJS.Timeout[] = [];

    recentBookings.forEach((booking) => {
      if (
        finalStatuses.includes(booking.status.toLowerCase()) &&
        !dismissedFinalBookings.has(booking.id)
      ) {
        const timer = setTimeout(() => {
          setDismissedFinalBookings((prev) => {
            const updated = new Set(prev);
            updated.add(booking.id);
            return updated;
          });
        }, 5000);
        timers.push(timer);
      }
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [recentBookings, dismissedFinalBookings]);

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

    const googleWindow = window as GoogleMapsWindow;
    if (googleWindow.google?.maps?.places) {
      setIsPlacesScriptLoaded(true);
      return;
    }

    const placesScriptSrc = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      googleMapsApiKey
    )}&libraries=places`;

    let script = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-places="true"][src*="libraries=places"]'
    );

    const onLoad = () => {
      setIsPlacesScriptLoaded(true);
      if (script) {
        script.dataset.loaded = "true";
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.src = placesScriptSrc;
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsPlaces = "true";
      document.head.appendChild(script);
    }

    if (script.dataset.loaded === "true") {
      setIsPlacesScriptLoaded(true);
      return;
    }

    script.addEventListener("load", onLoad);
    return () => {
      script?.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (!useGooglePlacesFallback || !isPlacesScriptLoaded) return;

    const googleWindow = window as GoogleMapsWindow;
    const places = googleWindow.google?.maps?.places;
    if (!places) return;

    const bindAutocomplete = (
      inputRef: { current: HTMLInputElement | null },
      autocompleteRef: { current: GooglePlacesAutocompleteInstance | null },
      boundInputRef: { current: HTMLInputElement | null },
      side: "pickup" | "drop"
    ) => {
      const input = inputRef.current;
      if (!input || boundInputRef.current === input) return;

      const autocomplete = new places.Autocomplete(input, {
        fields: ["formatted_address", "place_id", "address_components"],
        types: ["address"],
        componentRestrictions: { country: "us" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const formattedAddress = place?.formatted_address || "";
        const placeId = place?.place_id || "";
        const stateCode =
          place?.address_components
            ?.find((component) => component.types?.includes("administrative_area_level_1"))
            ?.short_name || "";

        if (!formattedAddress || !placeId) return;

        if (side === "pickup") {
          setPickupAddress(formattedAddress);
          setPickupAddressPlaceId(
            allowedAddressStateCodes.has(stateCode) ? placeId : ""
          );
          setPickupAddressStateCode(stateCode);
          clearFieldError("topField");
          setIsPickupSuggestionsOpen(false);
          return;
        }

        setDropAddress(formattedAddress);
        setDropAddressPlaceId(allowedAddressStateCodes.has(stateCode) ? placeId : "");
        setDropAddressStateCode(stateCode);
        clearFieldError("secondField");
        setIsDropSuggestionsOpen(false);
      });

      autocompleteRef.current = autocomplete;
      boundInputRef.current = input;
    };

    bindAutocomplete(
      pickupAddressInputRef,
      pickupAutocompleteRef,
      pickupBoundInputRef,
      "pickup"
    );
    bindAutocomplete(
      dropAddressInputRef,
      dropAutocompleteRef,
      dropBoundInputRef,
      "drop"
    );
  }, [useGooglePlacesFallback, isPlacesScriptLoaded]);

  const userName = useMemo(() => sessionData?.user?.name || "Traveler", [sessionData]);

  const initials = useMemo(() => {
    const source = (sessionData?.user?.name || "Traveler").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "T";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
  }, [sessionData]);

  const getNotificationMessage = (booking: any) => {
    const status = booking.status as string;
    const tripMode = booking.tripMode as string;
    const pickupLocation = tripMode === "pickup" ? booking.pickupLocation : booking.dropLocation;
    const dropLocation = tripMode === "pickup" ? booking.dropLocation : booking.pickupLocation;
    const pickupIcon = tripMode === "pickup" ? "✈️" : "📍";
    const dropIcon = tripMode === "pickup" ? "📍" : "✈️";
    const fare = booking.totalFareCents ? `$${(booking.totalFareCents / 100).toFixed(2)}` : null;

    let statusBadge = "bg-gray-100 text-gray-700";
    let actionText = "View Details";
    let actionColor = "bg-slate-600 hover:bg-slate-700";
    let statusLabel = "PENDING";

    switch (status) {
      case "pending":
        statusBadge = "bg-yellow-100 text-yellow-700";
        statusLabel = "PENDING";
        actionText = "Awaiting Approval";
        actionColor = "bg-yellow-600 hover:bg-yellow-700";
        break;
      case "confirmed":
        statusBadge = "bg-green-100 text-green-700";
        statusLabel = "APPROVED";
        actionText = `PAY ${fare || "Now"}`;
        actionColor = "bg-green-600 hover:bg-green-700";
        break;
      case "paid":
        statusBadge = "bg-blue-100 text-blue-700";
        statusLabel = "PAID";
        actionText = "Assigning Driver";
        actionColor = "bg-blue-600 hover:bg-blue-700";
        break;
      case "assigned":
        statusBadge = "bg-cyan-100 text-cyan-700";
        statusLabel = "EN ROUTE";
        actionText = `TRACK ${booking.driverName?.split(" ")[0] || "Driver"}`;
        actionColor = "bg-cyan-600 hover:bg-cyan-700";
        break;
      case "completed":
        statusBadge = "bg-purple-100 text-purple-700";
        statusLabel = "COMPLETED";
        actionText = "RATE RIDE";
        actionColor = "bg-purple-600 hover:bg-purple-700";
        break;
      case "cancelled":
        statusBadge = "bg-red-100 text-red-700";
        statusLabel = "CANCELLED";
        actionText = "BOOK AGAIN";
        actionColor = "bg-red-600 hover:bg-red-700";
        break;
      default:
        statusLabel = "UPDATE";
    }

    return {
      pickupLocation,
      dropLocation,
      pickupIcon,
      dropIcon,
      statusBadge,
      statusLabel,
      actionText,
      actionColor,
      fare,
    };
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
  };

  const handleTripModeChange = (mode: TripMode) => {
    setTripMode(mode);
    setIsAirportMenuOpen(false);
    setIsPassengerMenuOpen(false);
    setBookingErrors({});
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
    setBookingErrors((currentErrors) => ({
      ...currentErrors,
      selectedDate: undefined,
    }));

    // Safari keeps date popovers open until blur in some layouts.
    requestAnimationFrame(() => {
      dateInputRef.current?.blur();
    });
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 4);
    const hourDigits = digitsOnly.slice(0, 2);
    const minuteDigits = digitsOnly.slice(2, 4);

    let formattedHour = hourDigits;
    if (hourDigits.length === 2) {
      const parsedHour = Number.parseInt(hourDigits, 10);
      if (!Number.isNaN(parsedHour)) {
        if (parsedHour === 0) {
          formattedHour = "01";
        } else if (parsedHour > 12) {
          formattedHour = "12";
        }
      }
    }

    let formattedMinute = minuteDigits;
    if (minuteDigits.length === 2) {
      const parsedMinute = Number.parseInt(minuteDigits, 10);
      if (!Number.isNaN(parsedMinute) && parsedMinute > 59) {
        formattedMinute = "59";
      }
    }

    const formattedTime =
      digitsOnly.length <= 2
        ? formattedHour
        : `${formattedHour}:${formattedMinute}`;

    setSelectedTime(formattedTime);
    clearFieldError("selectedTime");
  };

  const clearFieldError = (fieldName: keyof BookingErrorState) => {
    setBookingErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));
  };

  const handleAddressSuggestionSelect = (
    side: "pickup" | "drop",
    suggestion: AddressSuggestion,
    errorKey: keyof BookingErrorState
  ) => {
    if (side === "pickup") {
      setPickupAddress(suggestion.formattedAddress);
      setPickupAddressPlaceId(suggestion.placeId);
      setPickupAddressStateCode(suggestion.stateCode);
      setPickupSuggestions([]);
      setIsPickupSuggestionsOpen(false);
    } else {
      setDropAddress(suggestion.formattedAddress);
      setDropAddressPlaceId(suggestion.placeId);
      setDropAddressStateCode(suggestion.stateCode);
      setDropSuggestions([]);
      setIsDropSuggestionsOpen(false);
    }

    clearFieldError(errorKey);
  };

  useEffect(() => {
    if (pickupAddressPlaceId || pickupAddress.trim().length < 3) {
      setPickupSuggestions([]);
      setPickupSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setPickupSuggestionsLoading(true);
      try {
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(pickupAddress.trim())}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setUseGooglePlacesFallback(true);
          setPickupSuggestions([]);
          return;
        }

        const data = (await response.json()) as {
          suggestions?: AddressSuggestion[];
          status?: string;
        };
        if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
          setUseGooglePlacesFallback(true);
          setPickupSuggestions([]);
          return;
        }
        setPickupSuggestions(data.suggestions ?? []);
      } catch {
        setPickupSuggestions([]);
      } finally {
        setPickupSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [pickupAddress, pickupAddressPlaceId]);

  useEffect(() => {
    if (dropAddressPlaceId || dropAddress.trim().length < 3) {
      setDropSuggestions([]);
      setDropSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setDropSuggestionsLoading(true);
      try {
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(dropAddress.trim())}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setUseGooglePlacesFallback(true);
          setDropSuggestions([]);
          return;
        }

        const data = (await response.json()) as {
          suggestions?: AddressSuggestion[];
          status?: string;
        };
        if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
          setUseGooglePlacesFallback(true);
          setDropSuggestions([]);
          return;
        }
        setDropSuggestions(data.suggestions ?? []);
      } catch {
        setDropSuggestions([]);
      } finally {
        setDropSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [dropAddress, dropAddressPlaceId]);

  const scrollAndFocusElement = (
    targetRef: HTMLElement | null,
    focusTarget?: HTMLElement | null
  ) => {
    const scrollTarget = targetRef ?? focusTarget;
    if (!scrollTarget) return;

    const headerOffset = 110;
    const targetTop =
      scrollTarget.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });

    const focusElement = focusTarget ?? scrollTarget;
    window.setTimeout(() => {
      focusElement.focus({ preventScroll: true });
    }, 220);
  };

  const validateBookingForm = () => {
    const nextErrors: BookingErrorState = {};

    const topFieldValue =
      topField.type === "airport"
        ? tripMode === "pickup"
          ? pickupAirport
          : dropAirport
        : pickupAddress;

    const secondFieldValue =
      secondField.type === "airport"
        ? tripMode === "pickup"
          ? dropAirport
          : pickupAirport
        : dropAddress;

    if (!topFieldValue.trim()) {
      nextErrors.topField = `${topField.label} is required.`;
    } else if (
      topField.type === "address" &&
      !pickupAddressPlaceId
    ) {
      nextErrors.topField =
        "Please select a full Connecticut or Massachusetts address from Google suggestions.";
    } else if (
      topField.type === "address" &&
      !allowedAddressStateCodes.has(pickupAddressStateCode)
    ) {
      nextErrors.topField = "Only Connecticut and Massachusetts addresses are allowed.";
    }

    if (!secondFieldValue.trim()) {
      nextErrors.secondField = `${secondField.label} is required.`;
    } else if (
      secondField.type === "address" &&
      !dropAddressPlaceId
    ) {
      nextErrors.secondField =
        "Please select a full Connecticut or Massachusetts address from Google suggestions.";
    } else if (
      secondField.type === "address" &&
      !allowedAddressStateCodes.has(dropAddressStateCode)
    ) {
      nextErrors.secondField = "Only Connecticut and Massachusetts addresses are allowed.";
    }

    if (!selectedDate) {
      nextErrors.selectedDate = "Date is required.";
    }

    if (!selectedTime.trim()) {
      nextErrors.selectedTime = "Time is required.";
    }

    if (!selectedPassengerCount) {
      nextErrors.selectedPassengerCount = "Passenger count is required.";
    }

    if (!selectedVehicleType) {
      nextErrors.selectedVehicleType = "Vehicle type is required.";
    }

    setBookingErrors(nextErrors);

    if (nextErrors.topField) {
      if (topField.type === "airport") {
        scrollAndFocusElement(
          topFieldSectionRef.current,
          document.getElementById(
            tripMode === "pickup" ? "pickup-airport-button" : "drop-airport-button"
          ) as HTMLElement | null
        );
      } else {
        scrollAndFocusElement(
          topFieldSectionRef.current,
          tripMode === "pickup"
            ? pickupAddressInputRef.current
            : dropAddressInputRef.current
        );
      }
      return false;
    }

    if (nextErrors.secondField) {
      if (secondField.type === "airport") {
        scrollAndFocusElement(
          secondFieldSectionRef.current,
          document.getElementById(
            tripMode === "pickup" ? "drop-airport-button" : "pickup-airport-button"
          ) as HTMLElement | null
        );
      } else {
        scrollAndFocusElement(
          secondFieldSectionRef.current,
          tripMode === "pickup"
            ? dropAddressInputRef.current
            : pickupAddressInputRef.current
        );
      }
      return false;
    }

    if (nextErrors.selectedDate) {
      scrollAndFocusElement(scheduleSectionRef.current, dateInputRef.current);
      return false;
    }

    if (nextErrors.selectedTime) {
      scrollAndFocusElement(scheduleSectionRef.current, timeInputRef.current);
      return false;
    }

    if (nextErrors.selectedPassengerCount) {
      scrollAndFocusElement(passengerSectionRef.current, passengerButtonRef.current);
      return false;
    }

    if (nextErrors.selectedVehicleType) {
      scrollAndFocusElement(vehicleSectionRef.current, vehicleCardsRef.current);
      return false;
    }

    return true;
  };

  const renderAddressSuggestions = (
    suggestions: AddressSuggestion[],
    isOpen: boolean,
    isLoading: boolean,
    onSelect: (suggestion: AddressSuggestion) => void
  ) => {
    if (useGooglePlacesFallback) return null;
    if (!isOpen) return null;

    return (
      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#BFE5FF] bg-white shadow-2xl">
        {isLoading ? (
          <p className="px-4 py-3 text-sm text-[#5D7490]">Loading suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[#5D7490]">
            No Connecticut or Massachusetts addresses found.
          </p>
        ) : (
          suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
              }}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#17324F] transition hover:bg-[#EAF6FF]"
            >
              <span className="pr-3">{suggestion.formattedAddress}</span>
              <span className="text-xs font-semibold text-[#5D7490]">{suggestion.stateCode}</span>
            </button>
          ))
        )}
      </div>
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
    onSelect: (value: string) => void,
    options?: {
      buttonId?: string;
      hasError?: boolean;
      errorMessage?: string;
      errorKey?: keyof BookingErrorState;
    }
  ) => (
    <div ref={airportPickerRef} className="relative mt-2">
      <button
        id={options?.buttonId}
        type="button"
        onClick={() => {
          setIsAirportMenuOpen((prev) => !prev);
          setIsPassengerMenuOpen(false);
        }}
        className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-white px-4 text-left text-sm text-[#17324F] outline-none transition hover:border-[#B7D8F4] focus:ring-4 focus:ring-[#38B6FF]/10 ${
          options?.hasError
            ? "border-[#F56B6B] focus:border-[#F56B6B] ring-4 ring-[#F56B6B]/10"
            : "border-[#D6E7F5] focus:border-[#38B6FF]"
        }`}
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
                  if (options?.errorKey) {
                    clearFieldError(options.errorKey);
                  }
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
        ref={passengerButtonRef}
        onClick={() => {
          setIsPassengerMenuOpen((prev) => !prev);
          setIsAirportMenuOpen(false);
        }}
        className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-white px-4 text-left text-sm text-[#17324F] outline-none transition hover:border-[#B7D8F4] focus:ring-4 focus:ring-[#38B6FF]/10 ${
          bookingErrors.selectedPassengerCount
            ? "border-[#F56B6B] focus:border-[#F56B6B] ring-4 ring-[#F56B6B]/10"
            : "border-[#D6E7F5] focus:border-[#38B6FF]"
        }`}
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
            const isDisabled = selectedVehicleType === "sedan" && count > 4;

            return (
              <button
                key={count}
                type="button"
                disabled={isDisabled}
                onPointerDown={(event) => {
                  event.preventDefault();
                  if (isDisabled) return;
                  setSelectedPassengerCount(value);
                  setIsPassengerMenuOpen(false);
                  clearFieldError("selectedPassengerCount");
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                  isDisabled
                    ? "cursor-not-allowed opacity-35"
                    : isActive
                      ? "bg-[#EAF6FF] font-semibold text-[#0E4A78]"
                      : "text-[#17324F] hover:bg-[#EAF6FF]"
                }`}
              >
                <span>
                  {count} passenger{count > 1 ? "s" : ""}
                </span>
                {isDisabled ? (
                  <span className="text-xs text-[#9BB0C5]">SUV only</span>
                ) : isActive ? (
                  <span className="text-[#38B6FF]">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  const renderVehicleTypeCards = () => (
    <div ref={vehicleCardsRef} tabIndex={-1} className="mt-2 grid grid-cols-2 gap-2 outline-none">
      {vehicleOptions.map((vehicle) => {
        const isSelected = selectedVehicleType === vehicle.id;

        return (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => {
              setSelectedVehicleType(vehicle.id);
              if (vehicle.id === "sedan" && Number(selectedPassengerCount) > 4) {
                setSelectedPassengerCount("4");
              }
              clearFieldError("selectedVehicleType");
            }}
            className={`group relative overflow-hidden rounded-2xl border bg-white text-left transition focus:outline-none focus:ring-4 focus:ring-[#38B6FF]/15 ${
              isSelected
                ? bookingErrors.selectedVehicleType
                  ? "border-[#F56B6B] shadow-[0_10px_20px_rgba(56,182,255,0.22)] ring-4 ring-[#F56B6B]/10"
                  : "border-[#38B6FF] shadow-[0_10px_20px_rgba(56,182,255,0.22)]"
                : bookingErrors.selectedVehicleType
                  ? "border-[#F56B6B] hover:border-[#F56B6B]"
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
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true">👥</span>
                  <span>{vehicle.passengerRange}</span>
                </span>
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

  const getRouteMetrics = async (origin: string, destination: string) => {
    try {
      const response = await fetch("/api/routes/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        distanceMeters?: number;
        distanceText?: string;
        durationText?: string;
      };

      if (!data.distanceMeters || !data.distanceText || !data.durationText) return null;

      return {
        distanceMeters: data.distanceMeters,
        distanceText: data.distanceText,
        durationText: data.durationText,
      };
    } catch {
      return null;
    }
  };

  const handleBookNow = async () => {
    if (isPending || !sessionData?.session) {
      router.push("/login");
      return;
    }

    if (!validateBookingForm()) return;

    const selectedVehicle = vehicleOptions.find(
      (vehicle) => vehicle.id === selectedVehicleType
    );

    if (!selectedVehicle || typeof window === "undefined") return;

    const pickupIsAirport = tripMode === "pickup";
    const pickupLocation = pickupIsAirport ? pickupAirport : pickupAddress;
    const dropLocation = pickupIsAirport ? dropAddress : dropAirport;
    const pickupRouteLocation = pickupIsAirport
      ? airportRouteLocationByLabel[pickupAirport] ?? pickupAirport
      : pickupAddress;
    const dropRouteLocation = pickupIsAirport
      ? dropAddress
      : airportRouteLocationByLabel[dropAirport] ?? dropAirport;
    const routeMetrics = await getRouteMetrics(pickupRouteLocation, dropRouteLocation);

    if (!routeMetrics) {
      window.alert("We could not estimate route details right now. Please verify locations and try again.");
      return;
    }

    const bookingSummary: BookingSummary = {
      tripMode,
      pickupLocation,
      dropLocation,
      pickupLabel: pickupIsAirport ? "Pickup (Airport)" : "Pickup (Address)",
      dropLabel: pickupIsAirport ? "Drop (Address)" : "Drop (Airport)",
      pickupAirport,
      dropAirport,
      pickupAddress,
      dropAddress,
      pickupAddressPlaceId,
      dropAddressPlaceId,
      date: selectedDate,
      time: selectedTime,
      meridiem: selectedMeridiem,
      passengerCount: selectedPassengerCount,
      vehicleType: selectedVehicle.id,
      vehicleLabel: selectedVehicle.label,
      vehicleImageSrc: selectedVehicle.imageSrc,
      passengerRange: selectedVehicle.passengerRange,
      bagLimit: selectedVehicle.bagLimit,
      vehicleHighlights: selectedVehicle.highlights,
      routeDistanceText: routeMetrics.distanceText,
      routeDistanceMeters: routeMetrics.distanceMeters,
      routeDurationText: routeMetrics.durationText,
    };

    window.sessionStorage.setItem(
      bookingSummaryStorageKey,
      JSON.stringify(bookingSummary)
    );

    setBookingErrors({});
    router.push("/ride-summary");
  };

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
                  <Link
                    href="/my-rides"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-[#17324F] transition hover:bg-[#EAF6FF]"
                  >
                    My Rides
                  </Link>
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

          {/* Ride Status Updates / Notifications - Horizontal Scrollable */}
          {(() => {
            const activeStatuses = [
              "pending",
              "approved",
              "confirmed",
              "paid",
              "assigned",
            ];
            const displayedBookings = recentBookings.filter((booking) => {
              const status = booking.status.toLowerCase();
              if (activeStatuses.includes(status)) return true;
              if (
                ["completed", "cancelled"].includes(status) &&
                !dismissedFinalBookings.has(booking.id)
              ) {
                return true;
              }
              return false;
            });

            return displayedBookings.length > 0 ? (
              <div className="mb-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="flex w-max min-w-full justify-start gap-3 pb-2 sm:justify-center">
                  {displayedBookings.map((booking) => {
                    const notification = getNotificationMessage(booking);
                    return (
                      <div
                        key={booking.id}
                        className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md sm:w-80"
                      >
                        {/* Top row: Pickup/Drop + Status Badge */}
                        <div className="flex items-start gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
                          <div className="flex-1 min-w-0">
                            {/* Pickup */}
                            <div className="flex items-center gap-1.5 min-w-0 sm:gap-2">
                              <span className="text-lg shrink-0">
                                {notification.pickupIcon}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 truncate sm:text-sm">
                                {notification.pickupLocation}
                              </span>
                            </div>

                            {/* Drop */}
                            <div className="mt-1 flex items-center gap-1.5 min-w-0 sm:mt-1.5 sm:gap-2">
                              <span className="text-lg shrink-0">
                                {notification.dropIcon}
                              </span>
                              <span className="text-xs text-slate-600 truncate sm:text-sm">
                                {notification.dropLocation}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap ${notification.statusBadge}`}>
                              {notification.statusLabel}
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Action Button */}
                        <Link
                          href="/my-rides"
                          className={`block px-3 py-1.5 text-center text-xs font-semibold text-white transition sm:px-4 sm:py-2 ${notification.actionColor}`}
                        >
                          {notification.actionText} →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}

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
              <label ref={topFieldSectionRef} className="block text-sm font-semibold text-[#1C3553]">
                {topField.label}
                {topField.type === "airport" ? (
                  renderAirportPicker(
                    tripMode === "pickup" ? pickupAirport : dropAirport,
                    tripMode === "pickup" ? setPickupAirport : setDropAirport,
                    {
                      buttonId:
                        tripMode === "pickup" ? "pickup-airport-button" : "drop-airport-button",
                      hasError: Boolean(bookingErrors.topField),
                      errorKey: "topField",
                    }
                  )
                ) : (
                  <>
                    <div className="relative mt-2">
                      <input
                        key={`address-${tripMode}-top`}
                        ref={tripMode === "pickup" ? dropAddressInputRef : pickupAddressInputRef}
                        type="text"
                        value={pickupAddress}
                        onFocus={() => {
                          setIsPickupSuggestionsOpen(true);
                        }}
                        onBlur={() => {
                          window.setTimeout(() => {
                            setIsPickupSuggestionsOpen(false);
                          }, 120);
                        }}
                        onChange={(event) => {
                          const value = event.target.value;
                          clearFieldError("topField");
                          setPickupAddress(value);
                          setPickupAddressPlaceId("");
                          setPickupAddressStateCode("");
                          setIsPickupSuggestionsOpen(true);
                        }}
                        placeholder={topField.placeholder}
                        className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm text-[#17324F] outline-none transition placeholder:text-[#7B8DA3] focus:ring-4 focus:ring-[#38B6FF]/10 lg:h-11 ${
                          bookingErrors.topField
                            ? "border-[#F56B6B] focus:border-[#F56B6B] ring-4 ring-[#F56B6B]/10"
                            : "border-[#D6E7F5] focus:border-[#38B6FF]"
                        }`}
                      />

                      {renderAddressSuggestions(
                        pickupSuggestions,
                        isPickupSuggestionsOpen,
                        pickupSuggestionsLoading,
                        (suggestion) =>
                          handleAddressSuggestionSelect("pickup", suggestion, "topField")
                      )}
                    </div>
                    {bookingErrors.topField ? (
                      <p className="mt-1 text-xs font-medium text-[#E25555]">
                        {bookingErrors.topField}
                      </p>
                    ) : null}
                  </>
                )}
                {topField.type === "airport" && bookingErrors.topField ? (
                  <p className="mt-1 text-xs font-medium text-[#E25555]">
                    {bookingErrors.topField}
                  </p>
                ) : null}
              </label>

              <label ref={secondFieldSectionRef} className="block text-sm font-semibold text-[#1C3553]">
                {secondField.label}
                {secondField.type === "airport" ? (
                  renderAirportPicker(
                    tripMode === "pickup" ? pickupAirport : dropAirport,
                    tripMode === "pickup" ? setPickupAirport : setDropAirport,
                    {
                      buttonId:
                        tripMode === "pickup" ? "drop-airport-button" : "pickup-airport-button",
                      hasError: Boolean(bookingErrors.secondField),
                      errorKey: "secondField",
                    }
                  )
                ) : (
                  <>
                    <div className="relative mt-2">
                      <input
                        key={`address-${tripMode}-second`}
                        ref={tripMode === "pickup" ? dropAddressInputRef : pickupAddressInputRef}
                        type="text"
                        value={dropAddress}
                        onFocus={() => {
                          setIsDropSuggestionsOpen(true);
                        }}
                        onBlur={() => {
                          window.setTimeout(() => {
                            setIsDropSuggestionsOpen(false);
                          }, 120);
                        }}
                        onChange={(event) => {
                          const value = event.target.value;
                          clearFieldError("secondField");
                          setDropAddress(value);
                          setDropAddressPlaceId("");
                          setDropAddressStateCode("");
                          setIsDropSuggestionsOpen(true);
                        }}
                        placeholder={secondField.placeholder}
                        className={`h-12 w-full rounded-2xl border bg-white px-4 text-sm text-[#17324F] outline-none transition placeholder:text-[#7B8DA3] focus:ring-4 focus:ring-[#38B6FF]/10 lg:h-11 ${
                          bookingErrors.secondField
                            ? "border-[#F56B6B] focus:border-[#F56B6B] ring-4 ring-[#F56B6B]/10"
                            : "border-[#D6E7F5] focus:border-[#38B6FF]"
                        }`}
                      />

                      {renderAddressSuggestions(
                        dropSuggestions,
                        isDropSuggestionsOpen,
                        dropSuggestionsLoading,
                        (suggestion) =>
                          handleAddressSuggestionSelect("drop", suggestion, "secondField")
                      )}
                    </div>
                    <p className="mt-2 text-xs font-normal text-[#5D7490] lg:mt-1.5">
                      Select your complete Connecticut or Massachusetts address for accurate pricing.
                    </p>
                    {bookingErrors.secondField ? (
                      <p className="mt-1 text-xs font-medium text-[#E25555]">
                        {bookingErrors.secondField}
                      </p>
                    ) : null}
                  </>
                )}
                {secondField.type === "airport" && bookingErrors.secondField ? (
                  <p className="mt-1 text-xs font-medium text-[#E25555]">
                    {bookingErrors.secondField}
                  </p>
                ) : null}
              </label>

              <div ref={scheduleSectionRef} className="block">
                <p className="text-sm font-semibold text-[#1C3553]">Schedule the ride</p>

                <label className="mt-2 block text-sm font-semibold text-[#1C3553]">
                  Date
                  <input
                    ref={dateInputRef}
                    type="date"
                    min={getTomorrowDateValue()}
                    value={selectedDate}
                    onChange={handleDateChange}
                    className={`mt-2 h-12 w-full rounded-2xl border bg-white px-4 text-sm text-[#17324F] outline-none transition focus:ring-4 focus:ring-[#38B6FF]/10 lg:h-11 ${
                      bookingErrors.selectedDate
                        ? "border-[#F56B6B] focus:border-[#F56B6B] ring-4 ring-[#F56B6B]/10"
                        : "border-[#D6E7F5] focus:border-[#38B6FF]"
                    }`}
                  />
                  <p className="mt-2 text-xs font-normal text-[#5D7490] lg:mt-1.5">
                    Schedule your ride for tomorrow or later. Same-day bookings are not available.
                  </p>
                  {bookingErrors.selectedDate ? (
                    <p className="mt-1 text-xs font-medium text-[#E25555]">
                      {bookingErrors.selectedDate}
                    </p>
                  ) : null}
                </label>

                <label className="mt-3 block text-sm font-semibold text-[#1C3553]">
                  Time
                  <div
                    className={`mt-2 flex h-12 items-stretch overflow-hidden rounded-2xl border bg-white outline-none transition focus-within:ring-4 focus-within:ring-[#38B6FF]/10 lg:h-11 ${
                      bookingErrors.selectedTime
                        ? "border-[#F56B6B] focus-within:border-[#F56B6B] focus-within:ring-4 focus-within:ring-[#F56B6B]/10"
                        : "border-[#D6E7F5] focus-within:border-[#38B6FF]"
                    }`}
                  >
                    <input
                      ref={timeInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="12:34"
                      value={selectedTime}
                      onChange={handleTimeChange}
                      className="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-[#17324F] outline-none"
                    />

                    <div className="my-1 mr-1 grid w-[92px] grid-cols-2 overflow-hidden rounded-xl border border-[#D6E7F5] bg-[#F8FBFF] sm:w-[108px]">
                      {(["AM", "PM"] as const).map((period) => {
                        const isActive = selectedMeridiem === period;

                        return (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setSelectedMeridiem(period)}
                            aria-pressed={isActive}
                            className={`text-sm font-semibold transition ${
                              isActive
                                ? "bg-gradient-to-r from-[#0B83E9] to-[#38B6FF] text-white"
                                : "text-[#1C3553] hover:bg-[#EEF5FD]"
                            }`}
                          >
                            {period}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-normal text-[#5D7490]">
                    Choose a pickup time and whether it is AM or PM.
                  </p>
                  {bookingErrors.selectedTime ? (
                    <p className="mt-1 text-xs font-medium text-[#E25555]">
                      {bookingErrors.selectedTime}
                    </p>
                  ) : null}
                </label>
              </div>

              <label ref={passengerSectionRef} className="block text-sm font-semibold text-[#1C3553]">
                Passenger Count
                {renderPassengerPicker()}
                {bookingErrors.selectedPassengerCount ? (
                  <p className="mt-1 text-xs font-medium text-[#E25555]">
                    {bookingErrors.selectedPassengerCount}
                  </p>
                ) : null}
              </label>

              <div ref={vehicleSectionRef} className="block">
                <p className="text-sm font-semibold text-[#1C3553]">Choose Your Ride</p>
                <p className="mt-0.5 text-xs font-medium text-[#5D7490]">
                  Select a vehicle that fits your needs
                </p>
                {renderVehicleTypeCards()}
                {bookingErrors.selectedVehicleType ? (
                  <p className="mt-1 text-xs font-medium text-[#E25555]">
                    {bookingErrors.selectedVehicleType}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={handleBookNow}
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
