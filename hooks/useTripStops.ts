import { nanoid } from "nanoid";
import { useTripStore } from "@/store";
import { Trip, TripMarker } from "@/types/type";

export const useTripStops = () => {
  const { activeTrip, setActiveTrip, addStop, clearActiveTrip } =
    useTripStore();

  // Add stop when user taps an address
  const handleAddStop = async (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    // Create active trip if none exists
    if (!activeTrip) {
      const newTrip: Trip = {
        trip_id: nanoid(),
        user_id: 0, // replace with actual userId
        user_name: "User", // replace with actual name
        start_address: location.address,
        start_latitude: location.latitude,
        start_longitude: location.longitude,
        stops: [],
        return_to_start: false,
        optimized_order: [],
        total_distance_km: 0,
        total_duration_min: 0,
        created_at: new Date().toISOString(),
        active_trip: true,
      };
      setActiveTrip(newTrip);
    }

    // Create new stop
    const newStop: TripMarker = {
      stop_id: nanoid(),
      trip_id: activeTrip ? activeTrip.trip_id : "", // will be replaced once trip exists
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      expected_distance: 0,
      expected_duration: 0,
    };

    // Add stop to state (local first)
    await addStop(newStop);
  };

  return {
    activeTrip,
    handleAddStop,
    clearActiveTrip,
  };
};
