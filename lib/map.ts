import { TripMarker } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

export const generateMarkersFromData = (
  stops: TripMarker[],
  optimizedOrder?: string[],
) => {
  const orderMap = optimizedOrder
    ? Object.fromEntries(optimizedOrder.map((id, index) => [id, index]))
    : {};

  // Just return the stops with their order index attached
  return stops.map((stop) => ({
    ...stop,
    orderIndex: orderMap[stop.stop_id] ?? 9999,
  }));
};

export const getDirectionsForTrip = async (
  markers: TripMarker[],
  returnToStart: boolean,
) => {
  // --- Basic validation ---
  if (!directionsAPI || markers.length < 1) {
    return null;
  }

  // If user has only one marker and does NOT return to start → no route possible
  if (markers.length < 2 && !returnToStart) {
    return null;
  }

  const origin = markers[0];
  const destination = returnToStart ? origin : markers[markers.length - 1];

  const waypointMarkers = returnToStart
    ? markers.slice(1) // All except first
    : markers.slice(1, -1); // All between origin and destination

  const originStr = `${origin.location.latitude},${origin.location.longitude}`;
  const destinationStr = `${destination.location.latitude},${destination.location.longitude}`;

  // --- Build URL ---
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${directionsAPI}`;

  if (waypointMarkers.length > 0) {
    const waypointsStr = waypointMarkers
      .map((m) => `${m.location.latitude},${m.location.longitude}`)
      .join("|");

    // Add optimization
    url += `&waypoints=optimize:true|${waypointsStr}`;
  }

  // --- Fetch directions ---
  try {
    const response = await fetch(url);
    const json = await response.json();

    if (json.status !== "OK") {
      console.error("Directions API error:", json.error_message || json.status);
      return null;
    }

    const route = json.routes[0];

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

  // 🟢 No markers, no user → fallback region
  if (allPoints.length === 0) return DEFAULT_REGION;

  // 🟢 Only user location → center on user
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

  // Safety minimums (avoids overly-zoomed map)
  if (latitudeDelta < 0.01) latitudeDelta = 0.01;
  if (longitudeDelta < 0.01) longitudeDelta = 0.01;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

// export const calculateDriverTimes = async ({
//   markers,
//   userLatitude,
//   userLongitude,
//   destinationLatitude,
//   destinationLongitude,
// }: {
//   markers: TripMarker[];
//   userLatitude: number | null;
//   userLongitude: number | null;
//   destinationLatitude: number | null;
//   destinationLongitude: number | null;
// }) => {
//   if (
//     !userLatitude ||
//     !userLongitude ||
//     !destinationLatitude ||
//     !destinationLongitude
//   )
//     return;
//
//   try {
//     const timesPromises = markers.map(async (marker) => {
//       const responseToUser = await fetch(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&key=${directionsAPI}`,
//       );
//       const dataToUser = await responseToUser.json();
//       const timeToUser = dataToUser.routes[0].legs[0].duration.value; // Time in seconds
//
//       const responseToDestination = await fetch(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`,
//       );
//       const dataToDestination = await responseToDestination.json();
//       const timeToDestination =
//         dataToDestination.routes[0].legs[0].duration.value; // Time in seconds
//
//       const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes
//       const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time
//
//       return { ...marker, time: totalTime, price };
//     });
//
//     return await Promise.all(timesPromises);
//   } catch (error) {
//     console.error("Error calculating driver times:", error);
//   }
// };
