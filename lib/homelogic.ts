// homeLogic.ts
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useFetch } from "@/lib/fetch";
import { Trip, TripMarker } from "@/types/type";
import {
  useUserLocationStore,
  useSheetStore,
  useTripStore,
  useDrawerStore,
} from "@/store";
import { getShortBase36Id, googleReverseGeocode } from "@/lib/utils";
import BottomSheet from "@gorhom/bottom-sheet";
import { Gesture } from "react-native-gesture-handler";
import { Alert, Keyboard } from "react-native";
import { extractAddressString, formatAddress } from "@/lib/addressFormatter";
import { getDirectionsForTrip, decodePolyline } from "@/lib/map";

export const useHomeLogic = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [searchInputHeight, setSearchInputHeight] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Guard against double-firing handleAddStop
  const isAddingStop = useRef(false);

  const { currentUserLocation, setCurrentUserLocation } =
    useUserLocationStore();
  const {
    fetchActiveTrip,
    reorderStopsManually,
    setRouteCoords,
    optimizeRoute,
  } = useTripStore();

  const hasActiveTrip = useTripStore((state) => state.activeTrip !== null);
  const { activeTrip, addStop } = useTripStore();
  const googleInputRef = useRef<any>(null);

  const contentGesture = Gesture.Native().simultaneousWithExternalGesture(
    Gesture.Pan().runOnJS(true),
  );

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  const setDrawerOpen = useDrawerStore((state) => state.setDrawerOpen);
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

  const handleDestinationPress = useCallback(
    (_location: { latitude: number; longitude: number; address: string }) => {
      // router.push("/(root)/find-ride");
    },
    [],
  );

  const handleManualReorder = useCallback(
    (newStops: TripMarker[], draggedStopId?: string) => {
      reorderStopsManually(newStops, draggedStopId);
    },
    [reorderStopsManually],
  );

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

        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });

          if (address?.[0]) {
            addressStr = extractAddressString(address);
          }
        } catch (expoError) {
          console.log("Expo reverse geocode failed, trying Google:", expoError);

          try {
            const googleAddress = await googleReverseGeocode(
              pos.coords.latitude,
              pos.coords.longitude,
            );

            if (googleAddress?.formatted_address) {
              addressStr = googleAddress.formatted_address;
            } else if (googleAddress?.name && googleAddress?.region) {
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
            address: addressStr || "Starting Address",
          });
        }
      } catch (error) {
        console.log("Location error:", error);
      }
    };

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

  useEffect(() => {
    const stops = activeTrip?.stops ?? [];
    const nonUserStops = stops.filter((s) => !s.isUserLocation);

    if (nonUserStops.length < 1 || !currentUserLocation) {
      setRouteCoords([]);
      return;
    }

    getDirectionsForTrip(
      nonUserStops,
      activeTrip?.return_to_start ?? false,
      currentUserLocation,
    ).then((result) => {
      if (result?.polyline) setRouteCoords(decodePolyline(result.polyline));
      else setRouteCoords([]);
    });
  }, [activeTrip?.stops, activeTrip?.return_to_start, currentUserLocation]);

  const handleAddStop = async ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    // Prevent double-fire from rapid taps or re-renders
    if (isAddingStop.current) return;
    isAddingStop.current = true;

    if (!activeTrip) {
      console.warn("No active trip to add stop to");
      isAddingStop.current = false;
      return;
    }
    if (!currentUserLocation) {
      Alert.alert("Location unavailable", "Enable GPS to add stops.");
      isAddingStop.current = false;
      return;
    }

    try {
      // Generate a fresh ID per call — never reuse a module-level shortId
      const stopId = getShortBase36Id(5);
      const formattedAddress = formatAddress(address);

      const result = await addStop(
        {
          stop_id: stopId,
          trip_id: activeTrip.trip_id,
          location: { latitude, longitude, address: formattedAddress },
          expected_duration: 0,
          expected_distance: 0,
          isUserLocation: false,
        },
        currentUserLocation,
      );

      if (result === null) {
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
    } finally {
      isAddingStop.current = false;
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
    setDrawerOpen,
    optimizeRoute,
    currentUserLocation,
  };
};
