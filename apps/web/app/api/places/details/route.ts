import { NextRequest, NextResponse } from "next/server";

const detailsEndpoint = "https://maps.googleapis.com/maps/api/place/details/json";

type GooglePlaceDetailsAddressComponent = {
  short_name?: string;
  types?: string[];
};

type GooglePlaceDetailsResult = {
  formatted_address?: string;
  place_id?: string;
  address_components?: GooglePlaceDetailsAddressComponent[];
};

type GooglePlaceDetailsResponse = {
  status?: string;
  result?: GooglePlaceDetailsResult;
};

const getMapsApiKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const getStateCode = (
  addressComponents: GooglePlaceDetailsAddressComponent[] | undefined
) =>
  addressComponents
    ?.find((component) => component.types?.includes("administrative_area_level_1"))
    ?.short_name ?? "";

// Called once per selection (not per keystroke) to confirm the canonical
// address/state and close out the Autocomplete session token for billing.
export async function GET(request: NextRequest) {
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { message: "Google Maps API key is not configured." },
      { status: 500 }
    );
  }

  const placeId = request.nextUrl.searchParams.get("placeId")?.trim() ?? "";
  if (!placeId) {
    return NextResponse.json({ message: "placeId is required." }, { status: 400 });
  }

  const sessionToken = request.nextUrl.searchParams.get("sessiontoken")?.trim();

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "place_id,formatted_address,address_component",
    key: apiKey,
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  try {
    const response = await fetch(`${detailsEndpoint}?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ message: "Place details lookup failed." }, { status: 502 });
    }

    const data = (await response.json()) as GooglePlaceDetailsResponse;
    if (data.status !== "OK" || !data.result?.place_id || !data.result.formatted_address) {
      return NextResponse.json({ message: "Place not found." }, { status: 404 });
    }

    return NextResponse.json({
      placeId: data.result.place_id,
      formattedAddress: data.result.formatted_address,
      stateCode: getStateCode(data.result.address_components),
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to fetch place details right now." },
      { status: 502 }
    );
  }
}
