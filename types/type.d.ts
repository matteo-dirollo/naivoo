import { TextInputProps, TouchableOpacityProps } from "react-native";
import React from "react";

export interface DrawerStore {
  activeDrawerId: string | null;
  setDrawerOpen: (id: string, isOpen: boolean) => void;
  isDrawerOpen: (id: string) => boolean;
}
export type MenuCategory = "trip" | "stop" | "google-input" | "undefined";
export interface MenuState {
  menus: Record<string, boolean>;
  menuTypes: Record<string, MenuCategory>;
  toggleMenu: (id: string, category: MenuCategory, isOpen?: boolean) => void;
  isMenuOpen: (id: string) => boolean;
  getMenuType: (id: string) => MenuCategory | undefined;
}

export type MapViewMode = "overview" | "navigation";

declare interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string;

  has_used_trial: boolean;
  trial_started_at: string | null;
  trial_expires_at: string | null;

  plan: "free" | "trial" | "premium" | "expired";
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  will_auto_renew: boolean;
  cancellation_at_period_end: boolean;

  payment_customer_id: string | null;
  payment_subscription_id: string | null;
  payment_method_last4: string | null;

  total_trips?: number;
  subscription_renewal_reminder_sent: boolean;
}

declare interface Coordinates {
  latitude: number;
  longitude: number;
  address: string;
}

declare interface Trip {
  name: string;
  trip_id: string;
  user_id: string;

  start_location: Coordinates;

  stops: TripMarker[];

  return_to_start: boolean;

  optimized_order: string[];

  total_distance_km: number;
  total_duration_min: number;

  created_at: string;
  active_trip: boolean;
}

declare interface TripMarker {
  stop_id: string;
  trip_id: string;
  location: Coordinates;
  expected_duration: number;
  expected_distance: number;
  time?: number;
  isUserLocation?: boolean;
  isPrioritized?: boolean;
  priorityPosition?: number | null;
  // Navigation status (local-only, not persisted to DB)
  isDone?: boolean;
  isSkipped?: boolean;
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

declare interface GoogleInputProps {
  icon?: string;
  initialLocation?: string;
  containerStyle?: string;
  textInputBackgroundColor?: string;
  handlePress: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onTextInputFocus?: () => void;
}

declare interface GoogleInputRef {
  clear: () => void;
}

declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
}

declare interface DraggableListProps {
  stops: TripMarker[];
  onReorder: (newStops: TripMarker[], draggedStopId?: string) => void;
  snapIndex: number;
  snapPoints: (string | number)[];
  searchInputHeight?: number;
  onDragStart?: () => void;
  onDragEndGlobal?: () => void;
}

export interface UserLocationStore {
  currentUserLocation: Coordinates | null;
  setCurrentUserLocation: (location: Coordinates) => void;
}

export interface TripStore {
  activeTrip: Trip | null;
  userTrips: Trip[];

  routeCoords: { latitude: number; longitude: number }[];
  setRouteCoords: (coords: { latitude: number; longitude: number }[]) => void;

  fetchUserTrips: (userId: string) => Promise<void>;
  fetchActiveTrip: (userId: string) => Promise<void>;
  saveActiveTrip: () => Promise<void>;

  setActiveTrip: (trip_id: string) => Promise<void>;
  setTripInactive: (trip_id: string) => Promise<void>;
  setUserTrips: (trips: Trip[]) => void;

  createTrip: (trip: Trip) => Promise<void>;
  updateTrip: (trip_id: string, updated: Partial<Trip>) => Promise<void>;
  deleteTrip: (trip_id: string) => Promise<void>;

  addStop: (
    stop: TripMarker,
    currentLocation: Coordinates,
  ) => Promise<TripMarker | null>;
  removeStop: (stop_id: string) => Promise<void>;
  updateStop: (stop_id: string, updated: Partial<TripMarker>) => Promise<void>;

  reorderStopsManually: (
    newStops: TripMarker[],
    draggedStopId: string | undefined,
  ) => void;
  setPriority: (stop_id: string, isPrioritized: boolean) => Promise<void>;
  clearAllPriorities: () => Promise<void>;
  optimizeRoute: (currentLocation: Coordinates) => Promise<void>;

  clearActiveTrip: () => void;
  clearUserTrips: () => void;
  clearAllTrips: () => void;
}

export interface SnapPointStore {
  snapIndex: number;
  isInputFocused: boolean;
  sheetRef: RefObject<BottomSheet> | null;

  setSnapIndex: (index: number) => void;
  setSheetRef: (ref: React.RefObject<BottomSheet>) => void;
  setIsInputFocused: (v: boolean) => void;

  closeSheet: () => void;
  openSmall: () => void;
  openMedium: () => void;
  openLarge: () => void;
}

export interface NavigationStore {
  isNavigating: boolean;
  currentStopIndex: number;
  viewMode: MapViewMode;

  startNavigation: () => void;
  stopNavigation: () => void;
  setViewMode: (mode: MapViewMode) => void;
  advanceToNextStop: () => void;
  goToPrevStop: () => void;
  markCurrentStopDone: (stops: TripMarker[]) => void;
  skipCurrentStop: (stops: TripMarker[]) => void;
}
