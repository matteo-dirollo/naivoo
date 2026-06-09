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

export const useDrawerStore = create<DrawerStore>((set, get) => ({
  activeDrawerId: null,

  setDrawerOpen: (id: string, isOpen: boolean) => {
    set({ activeDrawerId: isOpen ? id : null });
  },

  isDrawerOpen: (id: string) => get().activeDrawerId === id,
}));

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: {},
  menuTypes: {},

  toggleMenu: (id, type, isOpen) =>
    set((state) => ({
      menus: {
        ...state.menus,
        [id]: isOpen !== undefined ? isOpen : !state.menus[id],
      },
      menuTypes: {
        ...state.menuTypes,
        [id]: type, // Store the type when opening
      },
    })),

  isMenuOpen: (id) => !!get().menus[id],
  getMenuType: (id) => get().menuTypes[id],
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

  setActiveTrip: async (trip_id: string) => {
    // 1. Find the trip in the current list
    const trip = get().userTrips.find((t) => t.trip_id === trip_id);

    if (!trip) {
      console.error("Trip not found in local state");
      return;
    }

    // 2. Optimistically update local state immediately for responsiveness
    set({ activeTrip: trip });

    // 3. Sync with your backend
    try {
      await api.put(`/trip/${trip_id}`, { active_trip: true });
      // If your backend changes other fields (like a timestamp),
      // you might want to re-fetch or merge the response here.
    } catch (error) {
      console.error("Failed to sync active trip:", error);
      // Optional: Revert if the server call fails
    }
  },

  setTripInactive: async (trip_id: string) => {
    try {
      // 1. Call your API to set active_trip to false in the database
      await api.put(`/trip/${trip_id}`, { active_trip: false });

      // 2. Update local state
      set((state) => ({
        // Set activeTrip to null if this was the active one
        activeTrip:
          state.activeTrip?.trip_id === trip_id ? null : state.activeTrip,

        // Update the status in the userTrips array
        userTrips: state.userTrips.map((t) =>
          t.trip_id === trip_id ? { ...t, active_trip: false } : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to set trip inactive:", error);
      throw error;
    }
  },

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

  addStop: async (stop: TripMarker, currentLocation: Coordinates) => {
    const trip = get().activeTrip;
    if (!trip) return null;

    try {
      const res = await api.post(`/stop`, stop);

      if (res.data.data === null) {
        console.log("Duplicate stop detected, skipping add");
        return null;
      }

      const createdStop = res.data.data;

      // Build the updated stops list ourselves so we don't depend on
      // Zustand flushing before optimizeRoute reads get().activeTrip
      let updatedStops = [...trip.stops];
      if (createdStop.isUserLocation) {
        updatedStops = updatedStops.filter((s) => !s.isUserLocation);
      }
      updatedStops.push(createdStop);

      const updatedTrip: Trip = { ...trip, stops: updatedStops };

      // Write to state first
      set({ activeTrip: updatedTrip });

      // Then optimize — but force it to use updatedTrip, not whatever get() returns
      const nonUserStops = updatedStops.filter((s) => !s.isUserLocation);
      if (nonUserStops.length >= 1) {
        // Temporarily patch activeTrip so optimizeRoute sees the new stop
        // get().activeTrip is now updatedTrip since set() is synchronous in Zustand
        await get().optimizeRoute(currentLocation);
      }

      return createdStop;
    } catch (error) {
      console.error("Failed to add stop and optimize route:", error);
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

    const nonUserStops = trip.stops.filter((s) => !s.isUserLocation);
    const currentIndex = nonUserStops.findIndex((s) => s.stop_id === stop_id);
    const priorityPosition = isPrioritized ? currentIndex : null;

    // 1. Snapshot previous stops for rollback
    const previousStops = trip.stops;

    // 2. Update local state immediately (optimistic)
    set((state) => ({
      activeTrip: state.activeTrip
        ? {
            ...state.activeTrip,
            stops: state.activeTrip.stops.map((s) =>
              s.stop_id === stop_id
                ? { ...s, isPrioritized, priorityPosition }
                : s,
            ),
          }
        : null,
    }));

    // 3. Sync with backend, rollback on failure
    try {
      await api.patch(`/stop`, { stop_id, isPrioritized, priorityPosition });
    } catch (error) {
      console.error("Failed to update stop priority:", error);
      // Rollback to previous state
      set((state) => ({
        activeTrip: state.activeTrip
          ? { ...state.activeTrip, stops: previousStops }
          : null,
      }));
    }
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

    const nonUserStops = trip.stops.filter((s) => !s.isUserLocation);
    if (nonUserStops.length < 1) return;

    if (nonUserStops.length === 1) {
      const result = await getDirectionsForTrip(
        nonUserStops,
        trip.return_to_start ?? false,
        currentLocation,
      );
      if (result?.polyline) {
        set({ routeCoords: decodePolyline(result.polyline) });
      }
      return;
    }

    // Respect any existing manual order as the baseline
    const byId = new Map(nonUserStops.map((s) => [s.stop_id, s]));

    const alreadyOrdered: TripMarker[] =
      trip.optimized_order?.length > 0
        ? trip.optimized_order
            .map((id) => byId.get(id))
            .filter((s): s is TripMarker => s != null)
        : nonUserStops;

    const unstagedStops = nonUserStops.filter(
      (s) => !(trip.optimized_order ?? []).includes(s.stop_id),
    );

    const orderedStops: TripMarker[] = [...alreadyOrdered, ...unstagedStops];

    const totalCount = orderedStops.length;

    // priorityPosition was stored from nonUserStops indices — no offset needed
    const prioritized = orderedStops
      .filter((s) => s.isPrioritized && s.priorityPosition != null)
      .map((s) => ({
        ...s,
        priorityPosition: Math.max(0, s.priorityPosition ?? 0),
      }))
      .sort((a, b) => (a.priorityPosition ?? 0) - (b.priorityPosition ?? 0));

    const free = orderedStops.filter((s) => !s.isPrioritized);

    const persist = async (
      finalStops: TripMarker[],
      polyline: string,
      legs: any[],
    ) => {
      const totalDistanceKm = legs.reduce(
        (sum: number, leg: any) => sum + leg.distance_m / 1000,
        0,
      );
      const totalDurationMin = legs.reduce(
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
        routeCoords: decodePolyline(polyline),
      });
    };

    const applyOptimizedOrder = (
      order: number[],
      stops: TripMarker[],
    ): TripMarker[] => {
      if (!order?.length) return stops;

      // Google's waypoint_order indexes into the WAYPOINTS only (all stops except
      // the last one when returnToStart=false). Reconstruct correctly:
      const destination = stops[stops.length - 1];
      const waypoints = stops.slice(0, -1);

      const reordered = order
        .map((i) => waypoints[i])
        .filter((s): s is TripMarker => s != null);

      // Any waypoint Google didn't mention (safety net)
      const seen = new Set(reordered.map((s) => s.stop_id));
      const missed = waypoints.filter((s) => !seen.has(s.stop_id));

      return [...reordered, ...missed, destination];
    };

    // ── All stops locked — respect exact order, draw polyline only ──
    if (free.length === 0) {
      const result = await getDirectionsForTrip(
        orderedStops,
        false,
        currentLocation,
      );
      if (!result) return;
      // Still persist so distance/duration/order are saved
      await persist(orderedStops, result.polyline, result.legs);
      return;
    }

    // ── No locks — optimize all stops freely ──
    if (prioritized.length === 0) {
      const result = await getDirectionsForTrip(
        orderedStops,
        false,
        currentLocation,
      );
      if (!result) return;
      const finalStops = applyOptimizedOrder(
        result.optimized_order,
        orderedStops,
      );
      if (finalStops.length !== totalCount) {
        console.error("optimizeRoute: stop count mismatch (free path)", {
          expected: totalCount,
          got: finalStops.length,
        });
        return;
      }
      await persist(finalStops, result.polyline, result.legs);
      return;
    }

    // ── Mixed: locked stops pin their positions; free stops fill the gaps ──
    // (Steps 1–5 stay the same, just fix remapOrder → applyOptimizedOrder in Step 4)

    const skeleton: (TripMarker | null)[] = Array(totalCount).fill(null);
    const claimedPositions = new Set<number>();
    for (const locked of prioritized) {
      const pos = Math.min(
        Math.max(locked.priorityPosition ?? 0, 0),
        totalCount - 1,
      );
      let finalPos = pos;
      while (claimedPositions.has(finalPos) && finalPos < totalCount - 1)
        finalPos++;
      skeleton[finalPos] = locked;
      claimedPositions.add(finalPos);
    }

    type FreeRun = {
      slotIndices: number[];
      origin: Coordinates;
      destination: Coordinates | null;
    };
    const runs: FreeRun[] = [];
    let ri = 0;
    while (ri < totalCount) {
      if (skeleton[ri] !== null) {
        ri++;
        continue;
      }
      const slotIndices: number[] = [];
      while (ri < totalCount && skeleton[ri] === null) {
        slotIndices.push(ri);
        ri++;
      }
      const prevLocked =
        slotIndices[0] > 0 ? skeleton[slotIndices[0] - 1] : null;
      const segOrigin: Coordinates = prevLocked
        ? prevLocked.location
        : currentLocation;
      const afterIdx = slotIndices[slotIndices.length - 1] + 1;
      const nextLocked = afterIdx < totalCount ? skeleton[afterIdx] : null;
      runs.push({
        slotIndices,
        origin: segOrigin,
        destination: nextLocked?.location ?? null,
      });
    }

    // assign free stops to runs (cost matrix, same as before)
    const runStops: TripMarker[][] = runs.map(() => []);
    if (runs.length === 1) {
      runStops[0] = [...free];
    } else {
      for (const stop of free) {
        let bestRun = 0,
          bestScore = Infinity;
        runs.forEach((run, idx) => {
          const dOrigin = Math.hypot(
            stop.location.latitude - run.origin.latitude,
            stop.location.longitude - run.origin.longitude,
          );
          const dDest = run.destination
            ? Math.hypot(
                stop.location.latitude - run.destination.latitude,
                stop.location.longitude - run.destination.longitude,
              )
            : dOrigin;
          if (dOrigin + dDest < bestScore) {
            bestScore = dOrigin + dDest;
            bestRun = idx;
          }
        });
        runStops[bestRun].push(stop);
      }
      // rebalance overflow
      for (let i = 0; i < runs.length; i++) {
        while (runStops[i].length > runs[i].slotIndices.length) {
          const overflow = runStops[i].pop()!;
          let targetRun = -1,
            maxSlack = -1;
          runs.forEach((run, idx) => {
            const slack = run.slotIndices.length - runStops[idx].length;
            if (slack > maxSlack) {
              maxSlack = slack;
              targetRun = idx;
            }
          });
          if (targetRun !== -1) runStops[targetRun].push(overflow);
        }
      }
    }

    // optimize each segment — FIX: use applyOptimizedOrder, not remapOrder
    const optimizedRuns: TripMarker[][] = await Promise.all(
      runs.map(async (run, runIndex) => {
        const segStops = runStops[runIndex];
        if (segStops.length <= 1) return segStops;

        const markersForApi: TripMarker[] = run.destination
          ? [
              ...segStops,
              {
                stop_id: `__dest_seg_${runIndex}`,
                trip_id: trip.trip_id,
                location: run.destination,
                expected_duration: 0,
                expected_distance: 0,
              },
            ]
          : segStops;

        const segResult = await getDirectionsForTrip(
          markersForApi,
          false,
          run.origin,
        );
        if (!segResult?.optimized_order?.length) return segStops;

        // Use applyOptimizedOrder and strip the sentinel destination
        return applyOptimizedOrder(
          segResult.optimized_order,
          markersForApi,
        ).filter((s) => !s.stop_id.startsWith(`__dest_seg_`));
      }),
    );

    // fill skeleton
    let runIdx = 0;
    for (const run of runs) {
      const optimized = optimizedRuns[runIdx++];
      for (let s = 0; s < run.slotIndices.length; s++) {
        skeleton[run.slotIndices[s]] = optimized[s] ?? null;
      }
    }

    const finalStops = skeleton.filter((s): s is TripMarker => s != null);
    if (finalStops.length !== totalCount) {
      console.error("optimizeRoute: stop count mismatch (mixed path)", {
        expected: totalCount,
        got: finalStops.length,
      });
      return;
    }

    const fullResult = await getDirectionsForTrip(
      finalStops,
      false,
      currentLocation,
    );
    if (!fullResult) return;
    await persist(finalStops, fullResult.polyline, fullResult.legs);
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
