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

    const totalCount = orderedStops.length;

    // Locked stops sorted by the absolute position the user manually assigned.
    const prioritized = orderedStops
      .filter((s) => s.isPrioritized && s.priorityPosition != null)
      .sort((a, b) => (a.priorityPosition ?? 0) - (b.priorityPosition ?? 0));

    // Free stops are everything not locked.
    const free = orderedStops.filter((s) => !s.isPrioritized);

    // ── helper: remap Google's optimized_order indices back to TripMarker[] ──
    // getDirectionsForTrip contract:
    //   returnToStart=false → last marker is fixed destination, optimized_order
    //                         covers only the waypoints (all but last)
    //   returnToStart=true  → ALL markers are waypoints, optimized_order covers
    //                         every index
    const remapOrder = (
      order: number[],
      stops: TripMarker[],
      returnToStart: boolean,
    ): TripMarker[] => {
      if (stops.length === 0) return [];
      if (stops.length === 1) return stops;

      if (returnToStart) {
        const reordered = order
          .map((i) => stops[i])
          .filter((s): s is TripMarker => s != null);
        const seen = new Set(reordered.map((s) => s.stop_id));
        const missed = stops.filter((s) => !seen.has(s.stop_id));
        return [...reordered, ...missed];
      } else {
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

    // ── helper: persist result and update store ──
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

    // ── All stops locked — respect exact order, just draw the polyline ──
    if (free.length === 0) {
      const result = await getDirectionsForTrip(
        orderedStops,
        false,
        currentLocation,
      );
      if (!result) return;
      set({ routeCoords: decodePolyline(result.polyline) });
      return;
    }

    // ── No locks — optimize all stops freely (one-way trip) ──
    if (prioritized.length === 0) {
      const result = await getDirectionsForTrip(free, false, currentLocation);
      if (!result) return;

      const finalStops = remapOrder(result.optimized_order, free, false);

      if (finalStops.length !== free.length) {
        console.error("optimizeRoute: stop count mismatch (free path)", {
          expected: free.length,
          got: finalStops.length,
        });
        return;
      }

      await persist(finalStops, result.polyline, result.legs);
      return;
    }

    // ── Mixed: locked stops hold their exact priorityPosition indices;
    //    free stops are optimized by Google and slotted into the remaining
    //    positions in the final array.
    //
    // Step 1 — build a skeleton array of length totalCount.
    //   Locked stops are pinned at their priorityPosition.
    //   Positions that exceed array bounds are clamped to the last free slot.
    const skeleton: (TripMarker | null)[] = Array(totalCount).fill(null);
    const claimedPositions = new Set<number>();

    for (const locked of prioritized) {
      // Clamp position to valid range
      const pos = Math.min(
        Math.max(locked.priorityPosition ?? 0, 0),
        totalCount - 1,
      );
      // If two locked stops claim the same slot, shift the newcomer right
      let finalPos = pos;
      while (claimedPositions.has(finalPos)) {
        finalPos = Math.min(finalPos + 1, totalCount - 1);
      }
      skeleton[finalPos] = locked;
      claimedPositions.add(finalPos);
    }

    // Step 2 — identify contiguous runs of free slots in the skeleton.
    //   Each run is optimized independently so Google knows the real
    //   origin (the locked stop or user location just before the run)
    //   and destination (the locked stop just after the run).
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

      // Collect contiguous nulls
      const slotIndices: number[] = [];
      while (ri < totalCount && skeleton[ri] === null) {
        slotIndices.push(ri);
        ri++;
      }

      // Origin: the locked stop immediately before this run, or currentLocation
      const prevLocked =
        slotIndices[0] > 0 ? skeleton[slotIndices[0] - 1] : null;
      const segOrigin: Coordinates = prevLocked
        ? prevLocked.location
        : currentLocation;

      // Destination: the locked stop immediately after this run (null = no fixed end)
      const afterIdx = slotIndices[slotIndices.length - 1] + 1;
      const nextLocked = afterIdx < totalCount ? skeleton[afterIdx] : null;
      const segDestination: Coordinates | null = nextLocked
        ? nextLocked.location
        : null;

      runs.push({
        slotIndices,
        origin: segOrigin,
        destination: segDestination,
      });
    }

    // Sanity check: total free slots must equal free stops
    const totalFreeSlots = runs.reduce(
      (sum, r) => sum + r.slotIndices.length,
      0,
    );
    if (totalFreeSlots !== free.length) {
      console.error("optimizeRoute: free slot count mismatch", {
        freeSlots: totalFreeSlots,
        freeStops: free.length,
      });
      return;
    }

    // Step 3 — distribute free stops across runs by geographic proximity.
    //   Each free stop is assigned to the run whose corridor it sits closest
    //   to, measured as the minimum distance to either the run's origin or
    //   destination anchor. This ensures Google optimizes each segment with
    //   the stops that actually belong to that part of the route.
    //
    //   If a run has more/fewer slots than stops assigned by proximity we fall
    //   back to filling remaining slots with the closest unassigned stops, so
    //   slot counts always stay consistent with the skeleton.
    const runStops: TripMarker[][] = runs.map(() => []);

    for (const stop of free) {
      let bestRun = 0;
      let bestDist = Infinity;
      runs.forEach((run, idx) => {
        const distToOrigin = Math.hypot(
          stop.location.latitude - run.origin.latitude,
          stop.location.longitude - run.origin.longitude,
        );
        const distToDestination = run.destination
          ? Math.hypot(
              stop.location.latitude - run.destination.latitude,
              stop.location.longitude - run.destination.longitude,
            )
          : Infinity;
        const d = Math.min(distToOrigin, distToDestination);
        if (d < bestDist) {
          bestDist = d;
          bestRun = idx;
        }
      });
      runStops[bestRun].push(stop);
    }

    // If proximity assignment left some runs with too many or too few stops
    // relative to their slot count, rebalance by moving overflow stops to
    // the nearest under-filled run.
    const rebalance = () => {
      for (let i = 0; i < runs.length; i++) {
        while (runStops[i].length > runs[i].slotIndices.length) {
          // Pop the overflow stop and give it to the run with the most slack
          const overflow = runStops[i].pop()!;
          let targetRun = -1;
          let maxSlack = -1;
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
    };
    rebalance();

    const optimizedRuns: TripMarker[][] = await Promise.all(
      runs.map(async (run, runIndex) => {
        const segStops = runStops[runIndex];

        if (segStops.length <= 1) return segStops;

        // If there is a fixed locked stop after this run, append a dummy marker
        // so getDirectionsForTrip treats it as the endpoint and only optimizes
        // the real stops as waypoints.
        const markersForApi: TripMarker[] = run.destination
          ? [
              ...segStops,
              {
                stop_id: `__dest_seg`,
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

        return remapOrder(
          segResult.optimized_order,
          markersForApi,
          false,
        ).filter((s) => !s.stop_id.startsWith("__dest_"));
      }),
    );

    // Step 4 — fill skeleton slots with each run's optimized stops.
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

    // Step 5 — fetch the full polyline for the assembled route.
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
