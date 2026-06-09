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

export const getDirectionsForTrip = async (
  markers: TripMarker[],
  returnToStart: boolean,
  currentLocation?: Coordinates,
) => {
  if (!directionsAPI || markers.length < 1) return null;

  const nonUserStops = markers.filter((s) => !s.isUserLocation);
  if (nonUserStops.length < 1) return null;

  const originLocation = currentLocation ?? nonUserStops[0].location;
  const originStr = `${originLocation.latitude},${originLocation.longitude}`;

  // When returnToStart: origin = destination = current location, all stops are waypoints.
  // When not returnToStart: origin = current location, destination = current location too,
  // so ALL stops go into waypoints=optimize:true and Google can freely reorder them.
  // Previously the last stop was used as destination, which fixed it in place and made
  // reordering impossible when there were only 2 stops.
  const destinationStr = returnToStart ? originStr : originStr; // always round-trip through origin so all stops are free waypoints

  const waypointsStr = nonUserStops
    .map((m) => `${m.location.latitude},${m.location.longitude}`)
    .join("|");

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${originStr}` +
    `&destination=${destinationStr}` +
    `&waypoints=optimize:true|${waypointsStr}` +
    `&key=${directionsAPI}`;

  console.log("[getDirectionsForTrip] url:", url);

  try {
    const response = await fetch(url);
    const json = await response.json();

    if (json.status !== "OK") {
      console.error("Directions API error:", json.error_message || json.status);
      return null;
    }

    const route = json.routes[0];
    console.log(
      "[getDirectionsForTrip] waypoint_order from Google:",
      route.waypoint_order,
    );

    return {
      polyline: route.overview_polyline.points,
      optimized_order: route.waypoint_order ?? [],
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
