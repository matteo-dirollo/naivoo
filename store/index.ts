import { create } from "zustand";
import {
  UserLocationStore,
  TripStore,
  Trip,
  TripMarker,
  SnapPointStore,
  DrawerStore,
  Coordinates,
} from "@/types/type";
import { api } from "@/lib/api";
import { getShortBase36Id } from "@/lib/utils";
import { decodePolyline, getDirectionsForTrip } from "@/lib/map";

export const useDrawerStore = create<DrawerStore>((set) => ({
  isDrawerOpen: false, // Drawer is closed by default
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
}));

export const useUserLocationStore = create<UserLocationStore>((set) => ({
  currentUserLocation: null,

  setCurrentUserLocation: (location) => set({ currentUserLocation: location }),
}));

export const useTripStore = create<TripStore>((set, get) => ({
  activeTrip: null,
  userTrips: [],

  routeCoords: [],
  setRouteCoords: (coords) => set({ routeCoords: coords }),

  fetchUserTrips: async (userId: string) => {
    try {
      const res = await api.get(`/trip/${userId}`);
      set({ userTrips: res.data.data });
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
      // Optionally set empty array on error
      set({ userTrips: [] });
    }
  },

  fetchActiveTrip: async (userId: string) => {
    try {
      const res = await api.get(`/trip/${userId}`);

      const trips = res.data.data;
      const active = trips.find((t: Trip) => t.active_trip);

      set({ activeTrip: active || null });
    } catch (error: any) {
      console.error("fetchActiveTrip Error Details:");

      if (error.response) {
        // Server responded with error status
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);
      } else if (error.request) {
        // Request was made but no response
        console.error("No response received");
        console.error("Request:", error.request);
      } else {
        // Error in setting up request
        console.error("Error:", error.message);
      }

      set({ activeTrip: null });
    }
  },

  saveActiveTrip: async () => {
    const trip = get().activeTrip;
    if (!trip) return;

    try {
      const res = await api.put(`/trip/${trip.trip_id}`, trip);
      set({ activeTrip: res.data.data });
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
    }
  },

  // -----------------------------
  // LOCAL STATE
  // -----------------------------

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  setUserTrips: (trips) => set({ userTrips: trips }),

  // -----------------------------
  // TRIP CRUD
  // -----------------------------

  createTrip: async (data: Partial<Trip>) => {
    try {
      // Create the initial stop for user location
      const userLocationStop = {
        stop_id: getShortBase36Id(),
        location: data.start_location!,
        isUserLocation: true,
      };

      // Send trip data with initial stop
      const res = await api.post(`/trip/create`, {
        ...data,
        stops: [userLocationStop],
      });

      const created = res.data.data;

      set((state) => ({
        activeTrip: created,
        userTrips: [
          ...state.userTrips.map((t) => ({ ...t, active_trip: false })),
          created,
        ],
      }));
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
      throw error;
    }
  },

  updateTrip: async (trip_id: string, updated: Partial<Trip>) => {
    try {
      const res = await api.put(`/trip/${trip_id}`, updated);
      const updatedTrip = res.data.data;

      set((state) => ({
        activeTrip:
          state.activeTrip?.trip_id === trip_id
            ? { ...state.activeTrip, ...updatedTrip }
            : state.activeTrip,
        userTrips: state.userTrips.map((t) =>
          t.trip_id === trip_id ? { ...t, ...updatedTrip } : t,
        ),
      }));
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
      throw error;
    }
  },

  deleteTrip: async (trip_id: string) => {
    try {
      await api.delete(`/trip/${trip_id}`);

      set((state) => ({
        activeTrip:
          state.activeTrip?.trip_id === trip_id ? null : state.activeTrip,
        userTrips: state.userTrips.filter((t) => t.trip_id !== trip_id),
      }));
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
      throw error;
    }
  },

  // -----------------------------
  // STOP MANAGEMENT
  // -----------------------------

  addStop: async (stop: Omit<TripMarker, "stop_id">) => {
    const trip = get().activeTrip;
    if (!trip) return null;
    try {
      const res = await api.post(`/stop`, stop);
      // Check if API returned null (duplicate found)
      if (res.data.data === null) {
        console.log("Duplicate stop detected, skipping add");
        return null;
      }
      const createdStop = res.data.data;
      set((state) => {
        if (!state.activeTrip) return state;
        let updatedStops = [...state.activeTrip.stops];
        // If the new stop is a user location, remove any existing user location stops
        if (createdStop.isUserLocation) {
          updatedStops = updatedStops.filter((s) => !s.isUserLocation);
        }
        // Add the new stop
        updatedStops.push(createdStop);
        return {
          activeTrip: {
            ...state.activeTrip,
            stops: updatedStops,
          },
        };
      });

      return createdStop;
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
      throw error;
    }
  },

  removeStop: async (stop_id: string) => {
    try {
      await api.delete(`/stop`, { data: { stop_id } });

      set((state) => ({
        activeTrip: state.activeTrip
          ? {
              ...state.activeTrip,
              stops: (state.activeTrip.stops || []).filter(
                (s) => s.stop_id !== stop_id,
              ),
            }
          : null,
      }));
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
      throw error;
    }
  },

  updateStop: async (stop_id: string, updated: Partial<TripMarker>) => {
    try {
      const res = await api.put(`/stop`, { stop_id, ...updated });
      const newStop = res.data.data;

      set((state) => ({
        activeTrip: state.activeTrip
          ? {
              ...state.activeTrip,
              stops: (state.activeTrip.stops || []).map((s) =>
                s.stop_id === stop_id ? newStop : s,
              ),
            }
          : null,
      }));
    } catch (error: any) {
      if (error.response) {
        console.error("API Error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Network Error: No response received", error.request);
      } else {
        console.error("Error:", error.message);
      }
      throw error;
    }
  },

  // -----------------------------
  // OPTIMIZATION
  // -----------------------------

  reorderStopsManually: (newStops: TripMarker[]) => {
    const trip = get().activeTrip;
    if (!trip) return;

    // Any stop that was moved gets auto-prioritized at its new position
    const nonUserStops = newStops.filter((s) => !s.isUserLocation);
    const stopsWithPriority = newStops.map((s) => {
      if (s.isUserLocation) return s;
      const newIndex = nonUserStops.findIndex((n) => n.stop_id === s.stop_id);
      return {
        ...s,
        isPrioritized: true,
        priorityPosition: newIndex,
      };
    });

    set({ activeTrip: { ...trip, stops: stopsWithPriority } });

    // Persist priority changes to DB in the background
    stopsWithPriority
      .filter((s) => !s.isUserLocation)
      .forEach((s) => {
        api
          .patch(`/stop`, {
            stop_id: s.stop_id,
            isPrioritized: true,
            priorityPosition: s.priorityPosition,
          })
          .catch(console.error);
      });
  },

  setPriority: async (stop_id: string, isPrioritized: boolean) => {
    const trip = get().activeTrip;
    if (!trip) return;

    // Find what position this stop is currently at (excluding user location)
    const nonUserStops = trip.stops.filter((s) => !s.isUserLocation);
    const currentIndex = nonUserStops.findIndex((s) => s.stop_id === stop_id);

    await api.patch(`/stop`, {
      stop_id,
      isPrioritized,
      priorityPosition: isPrioritized ? currentIndex : null,
    });

    set((state) => ({
      activeTrip: state.activeTrip
        ? {
            ...state.activeTrip,
            stops: state.activeTrip.stops.map((s) =>
              s.stop_id === stop_id
                ? {
                    ...s,
                    isPrioritized,
                    priorityPosition: isPrioritized ? currentIndex : null,
                  }
                : s,
            ),
          }
        : null,
    }));
  },

  clearAllPriorities: async () => {
    const trip = get().activeTrip;
    if (!trip) return;

    // Clear all in parallel
    await Promise.all(
      trip.stops
        .filter((s) => s.isPrioritized)
        .map((s) =>
          api.patch(`/stop`, {
            stop_id: s.stop_id,
            isPrioritized: false,
            priorityPosition: null,
          }),
        ),
    );

    set((state) => ({
      activeTrip: state.activeTrip
        ? {
            ...state.activeTrip,
            stops: state.activeTrip.stops.map((s) => ({
              ...s,
              isPrioritized: false,
              priorityPosition: null,
            })),
          }
        : null,
    }));
  },
  optimizeRoute: async (currentLocation: Coordinates) => {
    const trip = get().activeTrip;
    if (!trip) return;

    const nonUserStops = trip.stops.filter((s) => !s.isUserLocation);
    if (nonUserStops.length < 1) return;

    // Separate prioritized (locked) from free stops
    const prioritized = nonUserStops
      .filter((s) => s.isPrioritized && s.priorityPosition != null)
      .sort((a, b) => (a.priorityPosition ?? 0) - (b.priorityPosition ?? 0));

    const free = nonUserStops.filter((s) => !s.isPrioritized);

    // If nothing is free, no optimization needed — order is fully manual
    if (free.length === 0) {
      const result = await getDirectionsForTrip(
        nonUserStops,
        trip.return_to_start,
        currentLocation,
      );
      if (!result) return;
      set({ routeCoords: decodePolyline(result.polyline) });
      return;
    }

    // Build the final ordered array by filling free stops into the gaps
    // between locked stops using Google to optimize each segment.
    //
    // Strategy: treat locked stops as fixed waypoints and optimize
    // free stops into the segments between them.
    //
    // Segments: [origin → lock0], [lock0 → lock1], ..., [lockN → destination]
    //
    // For each segment we call Google with just the free stops that
    // belong to that segment, and let it find the best sub-order.

    // Build slot boundaries — the fixed points in order
    const fixedPoints: Coordinates[] = [
      currentLocation,
      ...prioritized.map((s) => s.location),
      ...(trip.return_to_start ? [currentLocation] : []),
    ];

    // Distribute free stops across segments evenly (simple strategy:
    // assign each free stop to its nearest fixed boundary segment)
    const segments: TripMarker[][] = Array.from(
      { length: fixedPoints.length - 1 },
      () => [],
    );

    for (const stop of free) {
      let bestSegment = 0;
      let bestDist = Infinity;

      segments.forEach((_, segIdx) => {
        const segStart = fixedPoints[segIdx];
        const dist = Math.hypot(
          stop.location.latitude - segStart.latitude,
          stop.location.longitude - segStart.longitude,
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestSegment = segIdx;
        }
      });

      segments[bestSegment].push(stop);
    }

    // Optimize each segment independently
    const optimizedSegments: TripMarker[][] = await Promise.all(
      segments.map(async (segStops, segIdx) => {
        if (segStops.length === 0) return [];
        if (segStops.length === 1) return segStops;

        // Create synthetic markers for this segment
        const origin = fixedPoints[segIdx];
        const destination = fixedPoints[segIdx + 1];

        const syntheticMarkers: TripMarker[] = [
          // Dummy origin marker (user location or previous fixed stop)
          {
            stop_id: `__origin_${segIdx}`,
            trip_id: trip.trip_id,
            location: origin,
            expected_duration: 0,
            expected_distance: 0,
            isUserLocation: segIdx === 0,
          },
          ...segStops,
          // Dummy destination marker (next fixed stop)
          {
            stop_id: `__dest_${segIdx}`,
            trip_id: trip.trip_id,
            location: destination,
            expected_duration: 0,
            expected_distance: 0,
          },
        ];

        const segResult = await getDirectionsForTrip(
          syntheticMarkers,
          false,
          origin,
        );

        if (!segResult || segResult.optimized_order.length === 0) {
          return segStops; // fallback to original order
        }

        // optimized_order maps into segStops (the middle stops, not origin/dest)
        return segResult.optimized_order.map((i: number) => segStops[i]);
      }),
    );

    // Assemble final stop order:
    // [prioritized[0], ...optimizedSegments[0],
    //  prioritized[1], ...optimizedSegments[1], ...]
    const finalStops: TripMarker[] = [];
    prioritized.forEach((locked, idx) => {
      finalStops.push(...optimizedSegments[idx]);
      finalStops.push(locked);
    });
    // Remaining segment after the last locked stop
    finalStops.push(...optimizedSegments[prioritized.length]);

    if (finalStops.filter(Boolean).length !== nonUserStops.length) {
      console.error("optimizeRoute: stop count mismatch, aborting", {
        before: nonUserStops.length,
        after: finalStops.length,
      });
      return;
    }

    // Get the full route polyline for the final order
    const fullResult = await getDirectionsForTrip(
      finalStops,
      trip.return_to_start,
      currentLocation,
    );

    if (!fullResult) return;

    const totalDistanceKm = fullResult.legs.reduce(
      (sum, leg) => sum + leg.distance_m / 1000,
      0,
    );
    const totalDurationMin = fullResult.legs.reduce(
      (sum, leg) => sum + leg.duration_s / 60,
      0,
    );

    await api.put(`/trip/${trip.trip_id}`, {
      optimized_order: finalStops.map((s) => s.stop_id),
      total_distance_km: +totalDistanceKm.toFixed(2),
      total_duration_min: +totalDurationMin.toFixed(1),
    });

    set({
      activeTrip: {
        ...trip,
        stops: finalStops,
        optimized_order: finalStops.map((s) => s.stop_id),
        total_distance_km: +totalDistanceKm.toFixed(2),
        total_duration_min: +totalDurationMin.toFixed(1),
      },
      routeCoords: decodePolyline(fullResult.polyline),
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
