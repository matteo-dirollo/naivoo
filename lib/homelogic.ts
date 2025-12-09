// homeLogic.ts
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useFetch } from "@/lib/fetch";
import { Trip } from "@/types/type";
import { useLocationStore, useTripStore } from "@/store";
import { googleReverseGeocode } from "@/lib/utils";
import BottomSheet from "@gorhom/bottom-sheet";

export const useHomeLogic = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const sheetRef = useRef<BottomSheet>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { setCurrentUserLocation } = useLocationStore();
  const hasActiveTrip = useTripStore((state) => state.activeTrip !== null);

  // Snap points for BottomSheet
  const snapPoints = useMemo(() => ["25%", "50%", "100%"], []);

  // Open sheet programmatically
  const openSheet = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  // Track sheet changes
  const handleSheetChange = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Input field focus handler
  const onPressInputField = useCallback(() => {
    // Only snap to 50% if not already at 100%
    if (currentIndex !== 3) {
      sheetRef.current?.snapToIndex(2);
    }
    setIsInputFocused(true);
  }, [currentIndex]);

  // Sign out user
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

  // Fetch recent trips
  const {
    data: recentTrips,
    loading,
    error,
  } = useFetch<Trip[]>(`/(api)/trip/${user?.id}`);

  // Fetch current location
  useEffect(() => {
    let cancelled = false;

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        return;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (cancelled) return;

        let address;
        try {
          address = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          address = [
            {
              name: address[0]?.name ?? "",
              region: address[0]?.region ?? "",
            },
          ];
        } catch {
          address = [
            await googleReverseGeocode(
              pos.coords.latitude,
              pos.coords.longitude,
            ),
          ];
        }

        if (!cancelled) {
          setCurrentUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: `${address[0].name}, ${address[0].region}`,
          });
        }
      } catch (e) {
        console.log("Location error:", e);
      }
    };

    getLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    hasActiveTrip,
    sheetRef,
    currentIndex,
    setCurrentIndex,
    isInputFocused,
    setIsInputFocused,
    onPressInputField,
    handleSheetChange,
    snapPoints,
    openSheet,
    handleSignOut,
    handleDestinationPress,
    hasPermission,
    errorMsg,
    recentTrips,
    loading,
    error,
  };
};
