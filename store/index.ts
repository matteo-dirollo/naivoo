// ---------------------- LOCATION STORE --------------------------------

import { create } from "zustand";
import { LocationStore, TripStore, Trip, TripMarker } from "@/types/type";

export const useLocationStore = create<LocationStore>((set) => ({
  userLatitude: null,
  userLongitude: null,
  userAddress: null,

  destinationLatitude: null,
  destinationLongitude: null,
  destinationAddress: null,

  setUserLocation: ({ latitude, longitude, address }) =>
    set(() => ({
      userLatitude: latitude,
      userLongitude: longitude,
      userAddress: address,
    })),

  setDestinationLocation: ({ latitude, longitude, address }) =>
    set(() => ({
      destinationLatitude: latitude,
      destinationLongitude: longitude,
      destinationAddress: address,
    })),
}));

// @ts-ignore
export const useTripStore = create<TripStore>((set, get) => ({
  activeTrip: null,
  userTrips: [],

  // -----------------------------
  // SERVER SYNC
  // -----------------------------

  fetchUserTrips: async (userId: number) => {
    const res = await fetch(`https://your-api.com/trips/${userId}`);
    const trips = await res.json();
    set({ userTrips: trips });
  },

  fetchActiveTrip: async (userId: number) => {
    const res = await fetch(`https://your-api.com/trips/${userId}/active`);
    const trip = await res.json();
    set({ activeTrip: trip });
  },

  saveActiveTrip: async () => {
    const trip = get().activeTrip;
    if (!trip) return;

    const res = await fetch(`https://your-api.com/trips/${trip.trip_id}`, {
      method: "PUT",
      body: JSON.stringify(trip),
    });

    const updated = await res.json();
    set({ activeTrip: updated });
  },

  // -----------------------------
  // LOCAL STATE
  // -----------------------------

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  setUserTrips: (trips) => set({ userTrips: trips }),

  // -----------------------------
  // TRIP CRUD
  // -----------------------------

  createTrip: async (trip: Trip) => {
    const res = await fetch(`https://your-api.com/trips`, {
      method: "POST",
      body: JSON.stringify(trip),
    });

    const created = await res.json();
    set((state) => ({
      activeTrip: created,
      userTrips: [...state.userTrips, created],
    }));
  },

  updateTrip: (trip_id, updated) => {
    set((state) => ({
      activeTrip:
        state.activeTrip?.trip_id === trip_id
          ? { ...state.activeTrip, ...updated }
          : state.activeTrip,
      userTrips: state.userTrips.map((t) =>
        t.trip_id === trip_id ? { ...t, ...updated } : t,
      ),
    }));
  },
  // TODO: add logic to fetch the trip from the db
  deleteTrip: async (trip_id) => {
    await fetch(`https://your-api.com/trips/${trip_id}`, {
      method: "DELETE",
    });

    set((state) => ({
      activeTrip:
        state.activeTrip?.trip_id === trip_id ? null : state.activeTrip,
      userTrips: state.userTrips.filter((t) => t.trip_id !== trip_id),
    }));
  },

  // -----------------------------
  // STOP MANAGEMENT
  // -----------------------------

  addStop: async (stop) => {
    const trip = get().activeTrip;
    if (!trip) return;

    const res = await fetch(`https://your-api.com/stops`, {
      method: "POST",
      body: JSON.stringify(stop),
    });

    const createdStop = await res.json();

    set((state) => ({
      activeTrip: {
        ...state.activeTrip!,
        stops: [...state.activeTrip!.stops, createdStop],
      },
    }));
  },

  removeStop: async (stop_id) => {
    await fetch(`https://your-api.com/stops/${stop_id}`, {
      method: "DELETE",
    });

    set((state) => ({
      activeTrip: {
        ...state.activeTrip!,
        stops: state.activeTrip!.stops.filter((s) => s.stop_id !== stop_id),
      },
    }));
  },

  updateStop: async (stop_id, updated) => {
    const res = await fetch(`https://your-api.com/stops/${stop_id}`, {
      method: "PUT",
      body: JSON.stringify(updated),
    });

    const newStop = await res.json();

    set((state) => ({
      activeTrip: {
        ...state.activeTrip!,
        stops: state.activeTrip!.stops.map((s) =>
          s.stop_id === stop_id ? newStop : s,
        ),
      },
    }));
  },

  // -----------------------------
  // OPTIMIZATION
  // -----------------------------

  setOptimizedOrder: (optimizedIds) => {
    const trip = get().activeTrip;
    if (!trip) return;

    set({
      activeTrip: { ...trip, optimized_order: optimizedIds },
    });
  },

  reorderStopsAccordingToOptimization: () => {
    const trip = get().activeTrip;
    if (!trip || trip.optimized_order.length === 0) return;

    const idMap = new Map(trip.stops.map((stop) => [stop.stop_id, stop]));

    const reordered = trip.optimized_order
      .map((id) => idMap.get(id))
      .filter(Boolean) as TripMarker[];

    set({
      activeTrip: { ...trip, stops: reordered },
    });
  },

  // -----------------------------
  // CLEAR
  // -----------------------------

  clearActiveTrip: () => set({ activeTrip: null }),
  clearUserTrips: () => set({ userTrips: [] }),
  clearAllTrips: () => set({ activeTrip: null, userTrips: [] }),
}));
