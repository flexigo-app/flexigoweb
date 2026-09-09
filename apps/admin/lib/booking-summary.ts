export type VehicleType = "sedan" | "suv";

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
};

type FareConfig = {
  baseFare: number;
  perMileRate: number;
  minFare: number;
};

const fareConfigByVehicle: Record<VehicleType, FareConfig> = {
  sedan: {
    baseFare: 15,
    perMileRate: 1.45,
    minFare: 45,
  },
  suv: {
    baseFare: 25,
    perMileRate: 1.75,
    minFare: 65,
  },
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

export const metersToMiles = (meters: number) => meters / 1609.344;

export const calculateFare = (vehicleType: VehicleType, distanceMeters: number) => {
  const config = fareConfigByVehicle[vehicleType];
  const distanceMiles = metersToMiles(distanceMeters);
  const computedFare = config.baseFare + distanceMiles * config.perMileRate;
  return Math.max(config.minFare, computedFare);
};
