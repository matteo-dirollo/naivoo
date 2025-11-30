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

declare interface MapProps {
  destinationLatitude?: number;
  destinationLongitude?: number;
  onUserTimesCalculated?: (usersWithTimes: TripMarker[]) => void;
  onMapReady?: () => void;
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

declare interface PaymentProps {
  userId: number;
  fullName: string;
  email: string;
  amount: string;
}

// ----------------------- ZUSTAND: LOCATION STORE -----------------------

declare interface LocationStore {
  userLatitude: number | null;
  userLongitude: number | null;
  userAddress: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationAddress: string | null;
  setUserLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  setDestinationLocation: ({
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
  activeTrip: Trip | null; // trip being created or used now
  userTrips: Trip[]; // past trips belonging to current user

  // admin-wide list (optional but useful)
  // ACTIONS: FETCHING & SYNC
  setActiveTrip: (trip: Trip | null) => void;
  setUserTrips: (trips: Trip[]) => void;

  // CRUD OPERATIONS
  createTrip: (trip: Trip) => void;
  updateTrip: (trip_id: string, updated: Partial<Trip>) => void;
  deleteTrip: (Trip_id: string) => void;

  // STOP MANAGEMENT
  addStop: (stop: TripMarker) => void;
  removeStop: (stop_id: string) => void;
  updateStop: (stop_id: string, updated: Partial<TripMarker>) => void;

  // ORDER OPTIMIZATION (before/after calling Google Directions)
  setOptimizedOrder: (optimizedIds: string[]) => void;
  reorderStopsAccordingToOptimization: () => void; // reorder stops[] to match optimized_order[]

  // CLEANING
  clearActiveTrip: () => void;
  clearUserTrips: () => void;
  clearAllTrips: () => void;
}
