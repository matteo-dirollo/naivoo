import { Coordinates, TripMarker } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

export function decodePolyline(
  encoded: string,
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let shift = 0,
      result = 0,
      b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

/**
 * Extracts a high-resolution polyline by decoding every step's polyline
 * across all legs and concatenating them. This road-snaps precisely,
 * unlike overview_polyline which is a lossy simplification.
 */
function extractDetailedPolyline(
  legs: any[],
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];

  for (const leg of legs) {
    for (const step of leg.steps) {
      const stepPoints = decodePolyline(step.polyline.points);
      // Avoid duplicating the junction point between steps
      if (points.length > 0 && stepPoints.length > 0) {
        points.push(...stepPoints.slice(1));
      } else {
        points.push(...stepPoints);
      }
    }
  }

  return points;
}

export const generateMarkersFromData = (
  stops: TripMarker[],
  optimizedOrder?: string[],
) => {
  const orderMap = optimizedOrder
    ? Object.fromEntries(optimizedOrder.map((id, index) => [id, index]))
    : {};

  return stops.map((stop) => ({
    ...stop,
    orderIndex: orderMap[stop.stop_id] ?? 9999,
  }));
};

type DirectionsResult = {
  polyline: string;
  detailedPoints: { latitude: number; longitude: number }[];
  // Final visiting order of stop_ids, origin excluded, in the order the
  // route actually travels them (destination stop included, as the last
  // entry). Callers should use THIS instead of raw waypoint_order indices —
  // waypoint_order alone doesn't tell you where the fixed destination sits.
  optimized_order: string[];
  legs: {
    distance_m: number;
    duration_s: number;
    start_address: string;
    end_address: string;
  }[];
};

/**
 * Calls the Directions API for a single fixed origin/destination pair,
 * optimizing the order of any waypoints in between. Returns null on
 * failure so callers can skip/ignore this candidate.
 */
async function fetchOptimizedRoute(
  originStr: string,
  destinationStr: string,
  waypointStops: TripMarker[],
  destinationStopId: string | null,
  avoidHighways: boolean,
): Promise<DirectionsResult | null> {
  const waypointsParam =
    waypointStops.length > 0
      ? `&waypoints=optimize:true|${waypointStops
          .map((m) => `${m.location.latitude},${m.location.longitude}`)
          .join("|")}`
      : "";

  const avoidParam = avoidHighways ? `&avoid=highways` : "";

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${originStr}` +
    `&destination=${destinationStr}` +
    waypointsParam +
    avoidParam +
    `&key=${directionsAPI}`;

  try {
    const response = await fetch(url);
    const json = await response.json();

    if (json.status !== "OK") {
      console.error("Directions API error:", json.error_message || json.status);
      return null;
    }

    const route = json.routes[0];
    const detailedPolylinePoints = extractDetailedPolyline(route.legs);

    // waypoint_order is a list of indices into the *waypoints we sent*
    // (never including origin/destination). Map those back to stop_ids,
    // then append the fixed destination (if any) as the final stop.
    const waypointOrderIndices: number[] = route.waypoint_order ?? [];
    const orderedWaypointIds = waypointOrderIndices.map(
      (i) => waypointStops[i]?.stop_id,
    );
    const optimized_order = destinationStopId
      ? [...orderedWaypointIds, destinationStopId]
      : orderedWaypointIds;

    return {
      polyline: route.overview_polyline.points,
      detailedPoints: detailedPolylinePoints,
      optimized_order,
      legs: route.legs.map((leg: any) => ({
        distance_m: leg.distance.value,
        duration_s: leg.duration.value,
        start_address: leg.start_address,
        end_address: leg.end_address,
      })),
    };
  } catch (err) {
    console.error("Error fetching directions:", err);
    return null;
  }
}

export const getDirectionsForTrip = async (
  markers: TripMarker[],
  returnToStart: boolean,
  currentLocation?: Coordinates,
  avoidHighways: boolean = false,
): Promise<DirectionsResult | null> => {
  if (!directionsAPI || markers.length < 1) return null;

  const nonUserStops = markers.filter((s) => !s.isUserLocation);
  if (nonUserStops.length < 1) return null;

  const originLocation = currentLocation ?? nonUserStops[0].location;
  const originStr = `${originLocation.latitude},${originLocation.longitude}`;

  // ── Round trip: closed loop back to the starting point ──────────────
  // Destination = origin. All stops are optimizable waypoints — Google
  // finds the shortest loop that visits every stop and returns home.
  if (returnToStart) {
    return fetchOptimizedRoute(
      originStr,
      originStr,
      nonUserStops,
      null,
      avoidHighways,
    );
  }

  // ── One-way: let Google decide which stop should be last ────────────
  // The Directions API only optimizes the order of waypoints between a
  // FIXED origin and destination — it never chooses the destination for
  // you. To get the true shortest open path, we try each stop in turn as
  // the fixed destination (with the rest as optimizable waypoints) and
  // keep whichever candidate produces the shortest total distance.
  if (nonUserStops.length === 1) {
    const only = nonUserStops[0];
    const destStr = `${only.location.latitude},${only.location.longitude}`;
    return fetchOptimizedRoute(
      originStr,
      destStr,
      [],
      only.stop_id,
      avoidHighways,
    );
  }

  let bestResult: DirectionsResult | null = null;
  let bestDistance = Infinity;

  for (const candidate of nonUserStops) {
    const destStr = `${candidate.location.latitude},${candidate.location.longitude}`;
    const remainingWaypoints = nonUserStops.filter(
      (s) => s.stop_id !== candidate.stop_id,
    );

    const result = await fetchOptimizedRoute(
      originStr,
      destStr,
      remainingWaypoints,
      candidate.stop_id,
      avoidHighways,
    );
    if (!result) continue;

    const totalDistance = result.legs.reduce(
      (sum, leg) => sum + leg.distance_m,
      0,
    );

    if (totalDistance < bestDistance) {
      bestDistance = totalDistance;
      bestResult = result;
    }
  }

  return bestResult;
};

export const calculateRegion = ({
  markers,
  userLatitude,
  userLongitude,
}: {
  markers: TripMarker[];
  userLatitude?: number | null;
  userLongitude?: number | null;
}) => {
  const DEFAULT_REGION = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const hasUserLocation =
    typeof userLatitude === "number" && typeof userLongitude === "number";

  const allPoints = [
    ...markers.map((m) => ({
      latitude: m.location.latitude,
      longitude: m.location.longitude,
    })),
    ...(hasUserLocation
      ? [
          {
            latitude: userLatitude as number,
            longitude: userLongitude as number,
          },
        ]
      : []),
  ];

  if (allPoints.length === 0) return DEFAULT_REGION;

  if (allPoints.length === 1) {
    return {
      latitude: allPoints[0].latitude,
      longitude: allPoints[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const latitudes = allPoints.map((p) => p.latitude);
  const longitudes = allPoints.map((p) => p.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;

  let latitudeDelta = (maxLat - minLat) * 1.4;
  let longitudeDelta = (maxLng - minLng) * 1.4;

  if (latitudeDelta < 0.01) latitudeDelta = 0.01;
  if (longitudeDelta < 0.01) longitudeDelta = 0.01;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};
