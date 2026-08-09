import { NextRequest, NextResponse } from "next/server";

const ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";

const getMapsApiKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const formatDuration = (seconds: number): string => {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
};

export async function POST(request: NextRequest) {
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    return NextResponse.json({ message: "Routes API key not configured." }, { status: 500 });
  }

  let origin: string;
  let destination: string;

  try {
    const body = (await request.json()) as { origin?: unknown; destination?: unknown };
    origin = typeof body.origin === "string" ? body.origin.trim() : "";
    destination = typeof body.destination === "string" ? body.destination.trim() : "";
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (!origin || !destination) {
    return NextResponse.json({ message: "origin and destination are required." }, { status: 400 });
  }

  const requestBody = {
    origin: { address: origin },
    destination: { address: destination },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
  };

  try {
    const response = await fetch(ROUTES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Routes API request failed." },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      routes?: Array<{
        distanceMeters?: number;
        duration?: string;
      }>;
    };

    const route = data.routes?.[0];
    if (!route?.distanceMeters || !route.duration) {
      return NextResponse.json({ message: "No route found." }, { status: 404 });
    }

    const distanceMeters = route.distanceMeters;
    const durationSeconds = parseInt(route.duration.replace("s", ""), 10);

    const distanceMiles = distanceMeters / 1609.344;
    const distanceText =
      distanceMiles < 10
        ? `${distanceMiles.toFixed(1)} mi`
        : `${Math.round(distanceMiles)} mi`;

    return NextResponse.json({
      distanceMeters,
      distanceText,
      durationText: formatDuration(durationSeconds),
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to compute route right now." },
      { status: 502 }
    );
  }
}
