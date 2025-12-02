import { TextInputProps, TouchableOpacityProps } from "react-native";

declare interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string;

  // Trial
  has_used_trial: boolean; // The user can only use 7-day trial ONCE
  trial_started_at: string | null;
  trial_expires_at: string | null;

  // Subscription
  plan: "free" | "trial" | "premium" | "expired";
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  will_auto_renew: boolean; // Important
  cancellation_at_period_end: boolean; // Stripe-like logic for scheduled cancel

  // Billing Provider Data (mandatory if using Stripe, Checkout.com, Paddle)
  payment_customer_id: string | null; // Stripe customer ID
  payment_subscription_id: string | null; // Stripe subscription ID
  payment_method_last4: string | null; // Convenience only

  // Internal App Metrics
  total_trips?: number;
  subscription_renewal_reminder_sent: boolean;
}

declare interface Trip {
  trip_id: string;
  user_id: string;
  user_name: string;

  start_address: string;
  start_latitude: number;
  start_longitude: number;

  stops: TripMarker[];

  return_to_start: boolean;

  // Returned by Google Directions API ("optimize:true")
  optimized_order: string[]; // array of stop_id in optimized order

  total_distance_km: number;
  total_duration_min: number;

  created_at: string;
  active_trip: boolean;
}

declare interface TripMarker {
  stop_id: string;
  trip_id: string;
  address: string;
  latitude: number;
  longitude: number;
  expected_duration: number; // Google Directions duration (seconds)
  expected_distance: number;
  // TODO: add fields below in the db
  isUserLocation?: boolean;
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

// ----------------------- ZUSTAND: LOCATION STORE -----------------------

declare interface LocationStore {
  currentUserLatitude: number | null;
  currentUserLongitude: number | null;
  currentUserAddress: string | null;
  setCurrentUserLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

// ----------------------- ZUSTAND: TRIP STORE -----------------------

export interface TripStore {
  activeTrip: Trip | null;
  userTrips: Trip[];

  // SERVER SYNC
  fetchUserTrips: (userId: number) => Promise<void>;
  fetchActiveTrip: (userId: number) => Promise<void>;
  saveActiveTrip: () => Promise<void>; // inserts or updates DB

  // LOCAL STATE
  setActiveTrip: (trip: Trip | null) => void;
  setUserTrips: (trips: Trip[]) => void;

  // CRUD
  createTrip: (trip: Trip) => Promise<void>; // inserts into DB
  updateTrip: (trip_id: string, updated: Partial<Trip>) => Promise<void>;
  deleteTrip: (trip_id: string) => Promise<void>;

  // STOP MANAGEMENT
  addStop: (stop: TripMarker) => Promise<void>;
  removeStop: (stop_id: string) => Promise<void>;
  updateStop: (stop_id: string, updated: Partial<TripMarker>) => Promise<void>;

  // OPTIMIZATION
  setOptimizedOrder: (optimizedIds: string[]) => void;
  reorderStopsAccordingToOptimization: () => void;

  // CLEAR
  clearActiveTrip: () => void;
  clearUserTrips: () => void;
  clearAllTrips: () => void;
}
