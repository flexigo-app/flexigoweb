import { NextRequest, NextResponse } from "next/server";

const allowedStateCodes = new Set(["CT", "MA"]);
const autocompleteEndpoint = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const detailsEndpoint = "https://maps.googleapis.com/maps/api/place/details/json";

type GoogleAutocompletePrediction = {
  place_id?: string;
};

type GoogleAutocompleteResponse = {
  status?: string;
  error_message?: string;
  predictions?: GoogleAutocompletePrediction[];
};

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

type FilteredSuggestion = {
  placeId: string;
  formattedAddress: string;
  stateCode: string;
};

const getMapsApiKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const getStateCode = (
  addressComponents: GooglePlaceDetailsAddressComponent[] | undefined
) =>
  addressComponents
    ?.find((component) => component.types?.includes("administrative_area_level_1"))
    ?.short_name ?? "";

const buildAutocompleteUrl = (input: string, apiKey: string) => {
  const params = new URLSearchParams({
    input,
    key: apiKey,
    components: "country:us",
    types: "address",
  });

  return `${autocompleteEndpoint}?${params.toString()}`;
};

const buildDetailsUrl = (placeId: string, apiKey: string) => {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "place_id,formatted_address,address_component",
    key: apiKey,
  });

  return `${detailsEndpoint}?${params.toString()}`;
};

const getFilteredSuggestions = async (input: string, apiKey: string) => {
  const autocompleteResponse = await fetch(buildAutocompleteUrl(input, apiKey), {
    cache: "no-store",
  });

  if (!autocompleteResponse.ok) {
    return { status: "UPSTREAM_HTTP_ERROR", suggestions: [] as FilteredSuggestion[] };
  }

  const autocompleteData =
    (await autocompleteResponse.json()) as GoogleAutocompleteResponse;

  if (autocompleteData.status !== "OK" && autocompleteData.status !== "ZERO_RESULTS") {
    return {
      status: autocompleteData.status ?? "AUTOCOMPLETE_FAILED",
      errorMessage: autocompleteData.error_message ?? "",
      suggestions: [] as FilteredSuggestion[],
    };
  }

  const predictions = (autocompleteData.predictions ?? []).slice(0, 8);

  if (predictions.length === 0) {
    return { status: "OK", suggestions: [] as FilteredSuggestion[] };
  }

  const detailResults = await Promise.all(
    predictions.map(async (prediction) => {
      if (!prediction.place_id) return null;

      const detailsResponse = await fetch(
        buildDetailsUrl(prediction.place_id, apiKey),
        { cache: "no-store" }
      );

      if (!detailsResponse.ok) return null;

      const detailsData = (await detailsResponse.json()) as GooglePlaceDetailsResponse;
      if (detailsData.status !== "OK" || !detailsData.result) return null;

      const stateCode = getStateCode(detailsData.result.address_components);
      if (!allowedStateCodes.has(stateCode)) return null;

      const placeId = detailsData.result.place_id ?? "";
      const formattedAddress = detailsData.result.formatted_address ?? "";

      if (!placeId || !formattedAddress) return null;

      return {
        placeId,
        formattedAddress,
        stateCode,
      } satisfies FilteredSuggestion;
    })
  );

  const seen = new Set<string>();
  const suggestions = detailResults.filter((suggestion): suggestion is FilteredSuggestion => {
    if (!suggestion) return false;
    if (seen.has(suggestion.placeId)) return false;
    seen.add(suggestion.placeId);
    return true;
  });

  return {
    status: "OK",
    errorMessage: "",
    suggestions: suggestions.slice(0, 5),
  };
};

export async function GET(request: NextRequest) {
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { message: "Google Maps API key is not configured.", suggestions: [] },
      { status: 500 }
    );
  }

  const input = request.nextUrl.searchParams.get("input")?.trim() ?? "";
  if (input.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const result = await getFilteredSuggestions(input, apiKey);
    return NextResponse.json({
      suggestions: result.suggestions,
      status: result.status,
      errorMessage: result.errorMessage,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to fetch address suggestions right now.", suggestions: [] },
      { status: 502 }
    );
  }
}
