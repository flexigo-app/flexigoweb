export type VehicleType = string;

export type TripMode = "pickup" | "drop";

export type BookingSummary = {
  tripMode: TripMode;
  pickupLocation: string;
  dropLocation: string;
  pickupLabel: string;
  dropLabel: string;
  pickupAirport: string;
  dropAirport: string;
  pickupAddress: string;
  dropAddress: string;
  pickupAddressPlaceId?: string;
  dropAddressPlaceId?: string;
  date: string;
  time: string;
  meridiem: "AM" | "PM";
  passengerCount: string;
  vehicleType: VehicleType;
  vehicleLabel: string;
  vehicleImageSrc: string;
  passengerRange: string;
  bagLimit: string;
  vehicleHighlights: string[];
  routeDistanceText: string;
  routeDistanceMeters: number;
  routeDurationText: string;
  estimatedFareCents?: number;
};

export const bookingSummaryStorageKey = "flexigo-booking-summary";

export const readBookingSummaryFromStorage = () => {
  if (typeof window === "undefined") return null;

  const storedSummary = window.sessionStorage.getItem(bookingSummaryStorageKey);
  if (!storedSummary) return null;

  try {
    return JSON.parse(storedSummary) as BookingSummary;
  } catch {
    return null;
  }
};

export const formatSummaryDate = (dateValue: string) => {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export const formatSummaryTime = (timeValue: string, meridiem: "AM" | "PM") => {
  if (!timeValue) return "";

  return `${timeValue} ${meridiem} ET`;
};

export const formatUsDateTime = (value: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(date);
};

