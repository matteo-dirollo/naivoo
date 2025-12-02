import { Trip, TripMarker } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

export const generateMapMarkers = (
  location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  },
  trip: Trip | null,
): TripMarker[] => {
  const markers: TripMarker[] = [];

  // Add user's current location as a marker
  if (location.latitude && location.longitude) {
    markers.push({
      stop_id: "user_location",
      trip_id: trip?.trip_id || "N/A",
      address: location.address || "Your Location",
      latitude: location.latitude,
      longitude: location.longitude,
      expected_duration: 0,
      expected_distance: 0,
      isUserLocation: true,
    });
  }

  // Add trip stops as markers
  if (trip && trip.stops) {
    markers.push(...trip.stops);
  }

  return markers;
};

export const getDirectionsForTrip = async (
  markers: TripMarker[],
  returnToStart: boolean,
) => {
  if (!directionsAPI || markers.length < 1) {
    return null;
  }

  if (markers.length < 2 && !returnToStart) {
    return null;
  }

  const origin = markers[0];
  const destination = returnToStart ? origin : markers[markers.length - 1];
  const waypoints = returnToStart ? markers.slice(1) : markers.slice(1, -1);

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr = `${destination.latitude},${destination.longitude}`;

  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${directionsAPI}`;

  if (waypoints.length > 0) {
    const waypointsStr = waypoints
      .map((marker) => `${marker.latitude},${marker.longitude}`)
      .join("|");
    url += `&waypoints=${waypointsStr}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Directions API error:", data.error_message || data.status);
      return null;
    }

    return data.routes[0];
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
};

export const calculateRegion = (markers: TripMarker[]) => {
  if (markers.length === 0) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  if (markers.length === 1) {
    return {
      latitude: markers[0].latitude,
      longitude: markers[0].longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const latitudes = markers.map((marker) => marker.latitude);
  const longitudes = markers.map((marker) => marker.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;

  const latitudeDelta = (maxLat - minLat) * 1.5; // Add padding
  const longitudeDelta = (maxLng - minLng) * 1.5; // Add padding

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
