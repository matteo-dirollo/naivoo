import { create } from "zustand";
import { NavigationStore, MapViewMode, TripMarker } from "@/types/type";

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  isNavigating: false,
  currentStopIndex: 0,
  viewMode: "overview" as MapViewMode,

  startNavigation: () =>
    set({
      isNavigating: true,
      currentStopIndex: 0,
      viewMode: "navigation",
    }),

  stopNavigation: () =>
    set({
      isNavigating: false,
      currentStopIndex: 0,
      viewMode: "overview",
    }),

  setViewMode: (mode: MapViewMode) => set({ viewMode: mode }),

  advanceToNextStop: () =>
    set((state) => ({ currentStopIndex: state.currentStopIndex + 1 })),

  goToPrevStop: () =>
    set((state) => ({
      currentStopIndex: Math.max(0, state.currentStopIndex - 1),
    })),

  markCurrentStopDone: (stops: TripMarker[]) => {
    const { currentStopIndex } = get();
    const nonUserStops = stops.filter((s) => !s.isUserLocation);
    const nextIndex = currentStopIndex + 1;
    if (nextIndex < nonUserStops.length) {
      set({ currentStopIndex: nextIndex });
    }
    // If last stop, stay — caller handles "finish trip"
  },

  skipCurrentStop: (stops: TripMarker[]) => {
    const { currentStopIndex } = get();
    const nonUserStops = stops.filter((s) => !s.isUserLocation);
    const nextIndex = currentStopIndex + 1;
    if (nextIndex < nonUserStops.length) {
      set({ currentStopIndex: nextIndex });
    }
  },
}));
