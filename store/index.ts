import { create } from "zustand";
import {
  UserLocationStore,
  TripStore,
  Trip,
  TripMarker,
  SnapPointStore,
  DrawerStore,
  Coordinates,
  MenuState,
} from "@/types/type";
import { api } from "@/lib/api";
import { getShortBase36Id } from "@/lib/utils";
import { decodePolyline, getDirectionsForTrip } from "@/lib/map";

export const useDrawerStore = create<DrawerStore>((set) => ({
  isDrawerOpen: false, // Drawer is closed by default
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
}));

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: {},
  toggleMenu: (id, isOpen) =>
    set((state) => ({
      menus: {
        ...state.menus,
        [id]: isOpen !== undefined ? isOpen : !state.menus[id],
      },
    })),
  isMenuOpen: (id) => get().menus[id],
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

  reorderStopsManually: (newStops: TripMarker[], draggedStopId?: string) => {
    const trip = get().activeTrip;
    if (!trip) return;

    const nonUserStops = newStops.filter((s) => !s.isUserLocation);
    const newOrder = nonUserStops.map((s) => s.stop_id);

    const stopsWithPriority: TripMarker[] = newStops.map((s) => {
      if (s.isUserLocation) return s;
      const newIndex = nonUserStops.findIndex((n) => n.stop_id === s.stop_id);
      if (s.stop_id === draggedStopId) {
        return { ...s, isPrioritized: true, priorityPosition: newIndex };
      }
      if (s.isPrioritized) {
        return { ...s, priorityPosition: newIndex };
      }
      return s;
    });

    // Keep optimized_order in sync so optimizeRoute reads the right order
    set({
      activeTrip: {
        ...trip,
        stops: stopsWithPriority,
        optimized_order: newOrder,
      },
    });

    api
      .put(`/trip/${trip.trip_id}`, { optimized_order: newOrder })
      .catch(console.error);

    stopsWithPriority
      .filter((s) => !s.isUserLocation && s.isPrioritized)
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

  optimizeRoute: async (currentLocation: Coordinates) => {
    const trip = get().activeTrip;
    if (!trip) return;

    // ── Rebuild stop list honoring the DB-persisted manual order ──
    const nonUserStops = trip.stops.filter((s) => !s.isUserLocation);
    if (nonUserStops.length < 1) return;

    const byId = new Map(nonUserStops.map((s) => [s.stop_id, s]));
    const orderedStops: TripMarker[] =
      trip.optimized_order?.length > 0
        ? [
            // Stops that appear in optimized_order, in that order
            ...trip.optimized_order
              .map((id) => byId.get(id))
              .filter((s): s is TripMarker => s != null),
            // Any new stops added after the last reorder (not yet in optimized_order)
            ...nonUserStops.filter(
              (s) => !trip.optimized_order.includes(s.stop_id),
            ),
          ]
        : nonUserStops;

    const prioritized = orderedStops
      .filter((s) => s.isPrioritized && s.priorityPosition != null)
      .sort((a, b) => (a.priorityPosition ?? 0) - (b.priorityPosition ?? 0));

    const free = orderedStops.filter((s) => !s.isPrioritized);

    // ── getDirectionsForTrip contract (from lib/map.ts) ──
    // - currentLocation  → Google origin
    // - returnToStart=false: last marker = fixed destination, rest = waypoints
    // - returnToStart=true:  ALL markers = waypoints, origin = destination
    // - optimized_order  → 0-based indices into the waypoints only
    //
    // remapOrder reconstructs the full ordered array correctly.
    const remapOrder = (
      order: number[],
      stops: TripMarker[],
      returnToStart: boolean,
    ): TripMarker[] => {
      if (stops.length === 0) return [];
      if (stops.length === 1) return stops;

      if (returnToStart) {
        // All stops are waypoints — order covers every index
        const reordered = order
          .map((i) => stops[i])
          .filter((s): s is TripMarker => s != null);
        // Defensive: add any stop that didn't appear in the order
        const seen = new Set(reordered.map((s) => s.stop_id));
        const missed = stops.filter((s) => !seen.has(s.stop_id));
        return [...reordered, ...missed];
      } else {
        // Last stop is the fixed destination — order covers stops[0..n-2]
        const waypoints = stops.slice(0, -1);
        const destination = stops[stops.length - 1];
        const reordered = order
          .map((i) => waypoints[i])
          .filter((s): s is TripMarker => s != null);
        const seen = new Set(reordered.map((s) => s.stop_id));
        const missed = waypoints.filter((s) => !seen.has(s.stop_id));
        return [...reordered, ...missed, destination];
      }
    };

    // ── All stops locked — just draw the polyline ──
    if (free.length === 0) {
      const result = await getDirectionsForTrip(
        orderedStops,
        trip.return_to_start,
        currentLocation,
      );
      if (!result) return;
      set({ routeCoords: decodePolyline(result.polyline) });
      return;
    }

    // ── No locks — optimize all stops freely ──
    if (prioritized.length === 0) {
      const result = await getDirectionsForTrip(
        free,
        trip.return_to_start,
        currentLocation,
      );
      if (!result) return;

      const finalStops = remapOrder(
        result.optimized_order,
        free,
        trip.return_to_start,
      );

      if (finalStops.length !== free.length) {
        console.error("optimizeRoute: stop count mismatch (free path)", {
          expected: free.length,
          got: finalStops.length,
        });
        return;
      }

      const totalDistanceKm = result.legs.reduce(
        (sum: number, leg: any) => sum + leg.distance_m / 1000,
        0,
      );
      const totalDurationMin = result.legs.reduce(
        (sum: number, leg: any) => sum + leg.duration_s / 60,
        0,
      );

      await api.put(`/trip/${trip.trip_id}`, {
        optimized_order: finalStops.map((s) => s.stop_id),
        total_distance_km: +totalDistanceKm.toFixed(2),
        total_duration_min: +totalDurationMin.toFixed(1),
      });

      const userLocationStop = trip.stops.find((s) => s.isUserLocation);
      set({
        activeTrip: {
          ...trip,
          stops: userLocationStop
            ? [userLocationStop, ...finalStops]
            : finalStops,
          optimized_order: finalStops.map((s) => s.stop_id),
          total_distance_km: +totalDistanceKm.toFixed(2),
          total_duration_min: +totalDurationMin.toFixed(1),
        },
        routeCoords: decodePolyline(result.polyline),
      });
      return;
    }

    // ── Mixed: locked anchors + free stops ──
    //
    // anchorPoints = [currentLocation, lock0, lock1, ..., lockN]
    // segments[i]  = free stops closest to anchorPoints[i]
    // Always produces (prioritized.length + 1) segments.
    const anchorPoints: Coordinates[] = [
      currentLocation,
      ...prioritized.map((s) => s.location),
    ];

    const segments: TripMarker[][] = Array.from(
      { length: anchorPoints.length },
      () => [],
    );

    for (const stop of free) {
      let best = 0;
      let bestDist = Infinity;
      anchorPoints.forEach((anchor, idx) => {
        const d = Math.hypot(
          stop.location.latitude - anchor.latitude,
          stop.location.longitude - anchor.longitude,
        );
        if (d < bestDist) {
          bestDist = d;
          best = idx;
        }
      });
      segments[best].push(stop);
    }

    const optimizedSegments: TripMarker[][] = await Promise.all(
      segments.map(async (segStops, segIdx) => {
        if (segStops.length === 0) return [];
        if (segStops.length === 1) return segStops;

        const segOrigin = anchorPoints[segIdx];
        const segDestination =
          segIdx < anchorPoints.length - 1
            ? anchorPoints[segIdx + 1]
            : trip.return_to_start
              ? currentLocation
              : anchorPoints[anchorPoints.length - 1];

        // Append a dummy destination marker so getDirectionsForTrip
        // treats segStops as the waypoints and segDestination as the endpoint.
        // The dummy is NOT isUserLocation so it won't be filtered out.
        const markersWithDest: TripMarker[] = [
          ...segStops,
          {
            stop_id: `__dest_${segIdx}`,
            trip_id: trip.trip_id,
            location: segDestination,
            expected_duration: 0,
            expected_distance: 0,
          },
        ];

        const segResult = await getDirectionsForTrip(
          markersWithDest,
          false,
          segOrigin,
        );
        if (!segResult?.optimized_order?.length) return segStops;

        // optimized_order now correctly covers segStops (all except dest dummy)
        // @ts-ignore
        return segResult.optimized_order
          .map((i: number) => segStops[i])
          .filter((s: any): s is TripMarker => s != null);
      }),
    );

    // Assemble: [seg0…, lock0, seg1…, lock1, …, lockN-1, segN…]
    const finalStops: TripMarker[] = [];
    prioritized.forEach((locked, idx) => {
      finalStops.push(...(optimizedSegments[idx] ?? []));
      finalStops.push(locked);
    });
    finalStops.push(...(optimizedSegments[prioritized.length] ?? []));

    if (finalStops.filter(Boolean).length !== orderedStops.length) {
      console.error("optimizeRoute: stop count mismatch (mixed path)", {
        expected: orderedStops.length,
        got: finalStops.filter(Boolean).length,
      });
      return;
    }

    const fullResult = await getDirectionsForTrip(
      finalStops,
      trip.return_to_start,
      currentLocation,
    );
    if (!fullResult) return;

    const totalDistanceKm = fullResult.legs.reduce(
      (sum: number, leg: any) => sum + leg.distance_m / 1000,
      0,
    );
    const totalDurationMin = fullResult.legs.reduce(
      (sum: number, leg: any) => sum + leg.duration_s / 60,
      0,
    );

    await api.put(`/trip/${trip.trip_id}`, {
      optimized_order: finalStops.map((s) => s.stop_id),
      total_distance_km: +totalDistanceKm.toFixed(2),
      total_duration_min: +totalDurationMin.toFixed(1),
    });

    const userLocationStop = trip.stops.find((s) => s.isUserLocation);
    set({
      activeTrip: {
        ...trip,
        stops: userLocationStop
          ? [userLocationStop, ...finalStops]
          : finalStops,
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
