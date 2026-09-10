import { NextRequest, NextResponse } from "next/server";

const autocompleteEndpoint = "https://maps.googleapis.com/maps/api/place/autocomplete/json";

// Bias predictions toward Connecticut without an extra network round trip
// (avoids calling Place Details for every candidate just to filter by state).
// Center + radius sized generously so strictbounds doesn't clip towns near
// the state border; the terms-based state filter below still enforces CT-only.
const connecticutCenter = "41.5,-72.75";
const connecticutRadiusMeters = "140000";

type GoogleAutocompletePrediction = {
  place_id?: string;
  description?: string;
  terms?: { value?: string }[];
};

type GoogleAutocompleteResponse = {
  status?: string;
  error_message?: string;
  predictions?: GoogleAutocompletePrediction[];
};

type FilteredSuggestion = {
  placeId: string;
  formattedAddress: string;
  stateCode: string;
};

const getMapsApiKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// The legacy Autocomplete API doesn't return address_components, but for US
// street addresses the terms array is reliably [street, city, state, country].
const getStateCodeFromTerms = (terms: GoogleAutocompletePrediction["terms"]) => {
  if (!terms || terms.length < 2) return "";
  return terms[terms.length - 2]?.value ?? "";
};

const buildAutocompleteUrl = (input: string, apiKey: string, sessionToken?: string) => {
  const params = new URLSearchParams({
    input,
    key: apiKey,
    components: "country:us",
    types: "address",
    location: connecticutCenter,
    radius: connecticutRadiusMeters,
    strictbounds: "true",
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  return `${autocompleteEndpoint}?${params.toString()}`;
};

const getFilteredSuggestions = async (input: string, apiKey: string, sessionToken?: string) => {
  const autocompleteResponse = await fetch(buildAutocompleteUrl(input, apiKey, sessionToken), {
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

  const seen = new Set<string>();
  const suggestions = (autocompleteData.predictions ?? [])
    .map((prediction): FilteredSuggestion | null => {
      if (!prediction.place_id || !prediction.description) return null;

      const stateCode = getStateCodeFromTerms(prediction.terms);
      if (stateCode !== "CT") return null;
      if (seen.has(prediction.place_id)) return null;
      seen.add(prediction.place_id);

      return {
        placeId: prediction.place_id,
        formattedAddress: prediction.description,
        stateCode,
      };
    })
    .filter((suggestion): suggestion is FilteredSuggestion => suggestion !== null)
    .slice(0, 5);

  return { status: "OK", errorMessage: "", suggestions };
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
  const sessionToken = request.nextUrl.searchParams.get("sessiontoken")?.trim();

  try {
    const result = await getFilteredSuggestions(input, apiKey, sessionToken);
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
