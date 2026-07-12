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

  const date = new Date(`${dateValue}T00:00:00`);
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);

  return `${month} ${day}, ${year} (${weekday})`;
};

export const formatSummaryTime = (timeValue: string, meridiem: "AM" | "PM") => {
  if (!timeValue) return "";

  return `${timeValue} ${meridiem}`;
};
