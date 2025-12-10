// homeLogic.ts
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useFetch } from "@/lib/fetch";
import { Trip } from "@/types/type";
import { useLocationStore, useSheetStore, useTripStore } from "@/store";
import { googleReverseGeocode } from "@/lib/utils";
import BottomSheet from "@gorhom/bottom-sheet";

export const useHomeLogic = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { setCurrentUserLocation } = useLocationStore();
  const { fetchActiveTrip } = useTripStore();
  const hasActiveTrip = useTripStore((state) => state.activeTrip !== null);

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

  // Fetch recent trips
  const {
    data: recentTrips,
    loading,
    error,
  } = useFetch<Trip[]>(`/(api)/trip/${user?.id}`);

  useEffect(() => {
    setSheetRef(sheetRef);
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
  }, [setSheetRef, setCurrentUserLocation]);

  return {
    fetchActiveTrip,
    hasActiveTrip,
    sheetRef,
    isInputFocused,
    setIsInputFocused,
    onPressInputField,
    snapPoints,
    setSnapIndex,
    handleSignOut,
    handleDestinationPress,
    hasPermission,
    errorMsg,
    recentTrips,
    loading,
    error,
    user,
  };
};
