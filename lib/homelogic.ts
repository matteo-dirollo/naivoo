// homeLogic.ts
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useFetch } from "@/lib/fetch";
import { Trip, TripMarker } from "@/types/type";
import { useUserLocationStore, useSheetStore, useTripStore } from "@/store";
import { getShortBase36Id, googleReverseGeocode } from "@/lib/utils";
import BottomSheet from "@gorhom/bottom-sheet";
import { Gesture } from "react-native-gesture-handler";
import { Alert, Keyboard } from "react-native";
import { extractAddressString, formatAddress } from "@/lib/addressFormatter";

export const useHomeLogic = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [searchInputHeight, setSearchInputHeight] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { setCurrentUserLocation } = useUserLocationStore();
  const { fetchActiveTrip, reorderStopsManually } = useTripStore();
  const hasActiveTrip = useTripStore((state) => state.activeTrip !== null);
  const { activeTrip, addStop } = useTripStore();
  const googleInputRef = useRef<any>(null);
  const shortId = getShortBase36Id(5);

  const contentGesture = Gesture.Native().simultaneousWithExternalGesture(
    Gesture.Pan().runOnJS(true),
  );

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const {
    snapIndex,
    openMedium,
    setSnapIndex,
    setSheetRef,
    isInputFocused,
    setIsInputFocused,
  } = useSheetStore();

  const onPressInputField = useCallback(() => {
    setSheetRef(sheetRef);
    if (snapIndex !== 3) {
      openMedium();
    }
    setIsInputFocused(true);
  }, [snapIndex]);

  const handleSignOut = useCallback(() => {
    signOut();
    router.replace("/(auth)/sign-in");
  }, [signOut]);

  // Destination selection
  const handleDestinationPress = useCallback(
    (location: { latitude: number; longitude: number; address: string }) => {
      // router.push("/(root)/find-ride");
    },
    [],
  );

  const handleManualReorder = useCallback(
    (newStops: TripMarker[]) => {
      reorderStopsManually(newStops);
    },
    [reorderStopsManually],
  );

  // Fetch recent trips
  const {
    data: recentTrips,
    loading,
    error,
  } = useFetch<Trip[]>(`/(api)/trip/${user?.id}`);

  useEffect(() => {
    let cancelled = false;

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (cancelled) return;

        let addressStr = "";

        // Try Expo's reverse geocoding first
        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });

          if (address?.[0]) {
            // Cleaner way to build address from Expo
            const parts = [
              address[0].name,
              address[0].street,
              address[0].city,
              address[0].region,
              address[0].country,
            ].filter(Boolean);

            addressStr = extractAddressString(address);
          }
        } catch (expoError) {
          console.log("Expo reverse geocode failed, trying Google:", expoError);

          // Fallback to Google Geocoding
          try {
            const googleAddress = await googleReverseGeocode(
              pos.coords.latitude,
              pos.coords.longitude,
            );

            // Use formatted_address directly from Google response
            if (googleAddress?.formatted_address) {
              addressStr = googleAddress.formatted_address;
            } else if (googleAddress?.name && googleAddress?.region) {
              // Fallback to manual construction if formatted_address isn't available
              addressStr = `${googleAddress.name}, ${googleAddress.region}`;
            }
          } catch (googleError) {
            console.log("Google reverse geocode also failed:", googleError);
          }
        }

        if (!cancelled) {
          setCurrentUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            // Use the address string if we got it, otherwise use coordinates as fallback
            address: addressStr || "Current User Location",
          });
        }
      } catch (error) {
        console.log("Location error:", error);
        // Consider setting a default location or showing an error to user
      }
    };

    // ADD THIS: Fetch active trip when component mounts or user changes
    const initializeData = async () => {
      if (user?.id) {
        await fetchActiveTrip(user.id);
      }
      await getLocation();
    };

    initializeData();

    return () => {
      cancelled = true;
    };
  }, [setCurrentUserLocation, sheetRef, user?.id, fetchActiveTrip]);

  const handleAddStop = async ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    if (!activeTrip) {
      console.warn("No active trip to add stop to");
      return;
    }

    try {
      const formattedAddress = formatAddress(address);
      const result = await addStop({
        stop_id: shortId,
        trip_id: activeTrip.trip_id,
        location: { latitude, longitude, address },
        expected_duration: 0,
        expected_distance: 0,
        isUserLocation: false,
      });
      if (result === null) {
        // Show a user-friendly message
        Alert.alert(
          "Duplicate Location",
          "This stop is already in your trip.",
          [{ text: "OK" }],
        );
      }

      googleInputRef.current?.clear();

      Keyboard.dismiss();
      setIsInputFocused(false);
    } catch (error) {
      console.error("Failed to add stop:", error);
    }
  };

  return {
    hasActiveTrip,
    sheetRef,
    isInputFocused,
    setIsInputFocused,
    onPressInputField,
    searchInputHeight,
    setSearchInputHeight,
    contentGesture,
    snapPoints,
    snapIndex,
    setSnapIndex,
    isDragging,
    setIsDragging,
    handleSignOut,
    handleDestinationPress,
    hasPermission,
    errorMsg,
    recentTrips,
    activeTrip,
    addStop,
    googleInputRef,
    handleAddStop,
    handleManualReorder,
    loading,
    error,
  };
};
