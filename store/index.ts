import { create } from "zustand";
import {
  LocationStore,
  TripStore,
  Trip,
  TripMarker,
  SnapPointStore,
} from "@/types/type";

export const useLocationStore = create<LocationStore>((set) => ({
  currentUserLatitude: null,
  currentUserLongitude: null,
  currentUserAddress: null,

  setCurrentUserLocation: ({ latitude, longitude, address }) =>
    set(() => ({
      currentUserLatitude: latitude,
      currentUserLongitude: longitude,
      currentUserAddress: address,
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
    const res = await fetch(`/(api)/trip/${userId}`);
    const trips = await res.json();
    set({ userTrips: trips });
  },

  fetchActiveTrip: async (userId: number) => {
    const res = await fetch(`/(api)/trip/${userId}/active`);
    const trip = await res.json();
    set({ activeTrip: trip });
  },

  saveActiveTrip: async () => {
    const trip = get().activeTrip;
    if (!trip) return;

    const res = await fetch(`/(api)/trip/${trip.trip_id}`, {
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
    const res = await fetch("/(api)/trip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    });

    const created = await res.json();
    set((state) => ({
      activeTrip: created.data,
      userTrips: [...state.userTrips, created.data],
    }));
  },

  updateTrip: (trip_id, updated: Partial<Trip>) => {
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
  deleteTrip: async (trip_id) => {
    await fetch(`/(api)/trip/${trip_id}`, {
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

    const res = await fetch(`/(api)/`, {
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
    await fetch(`/(api)/${stop_id}`, {
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
    const res = await fetch(`/(api)/${stop_id}`, {
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

export const useSheetStore = create<SnapPointStore>((set, get) => ({
  snapIndex: 1, // default 25%
  isInputFocused: false,
  sheetRef: null,

  setSheetRef: (ref) => set({ sheetRef: ref }),
  setSnapIndex: (index) => set({ snapIndex: index }),
  setIsInputFocused: (v: boolean) => set({ isInputFocused: v }),

  closeSheet: () => {
    get().sheetRef?.current?.snapToIndex(0);
    set({ snapIndex: 0 });
  },
  openSmall: () => {
    get().sheetRef?.current?.snapToIndex(1);
    set({ snapIndex: 1 });
  },
  openMedium: () => {
    get().sheetRef?.current?.snapToIndex(2);
    set({ snapIndex: 2 });
  },
  openLarge: () => {
    get().sheetRef?.current?.snapToIndex(3);
    set({ snapIndex: 3 });
  },
}));
