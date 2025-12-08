import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useFetch } from "@/lib/fetch";
import { Trip } from "@/types/type";
import Map from "@/components/Map";
import { useLocationStore } from "@/store";
import { googleReverseGeocode } from "@/lib/utils";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import { Portal } from "@gorhom/portal";
import GoogleTextInput from "@/components/GoogleTextInput";
import { icons } from "@/constants";

// TODO: set camera
// getCamera
// animateCamera 	camera: Camera, { duration: Number }
// Animate the camera to a new view. You can pass a partial camera object here;
// any property not given will remain unmodified. duration is not supported on iOS.

export default function Home() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const sheetRef = useRef<BottomSheet>(null);

  const { setCurrentUserLocation } = useLocationStore();
  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: recentTrips,
    loading,
    error,
  } = useFetch<Trip[]>(`/(api)/trip/${user?.id}`);

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
          // Normalize to same shape as Google fallback
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

  const handleDestinationPress = (location: {
    // latitude: number;
    // longitude: number;
    // address: string;
  }) => {
    // router.push("/(root)/find-ride");
  };

  const snapPoints = useMemo(() => ["25%", "50%", "100%"], []);

  const openSheet = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  return (
    <View className="flex-1">
      {/* MAP BACKGROUND */}
      <View className="absolute inset-0" pointerEvents="none">
        <Map />
      </View>

      <Portal>
        <BottomSheet
          ref={sheetRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          backgroundStyle={{ backgroundColor: "#141714" }}
        >
          <BottomSheetView className="flex-1">
            <View className="flex-1 items-center justify-center p-5 space-y-4">
              <GoogleTextInput
                icon={icons.search}
                containerStyle={"bg-[#1f201e] shadow-md shadow-neutral-300"}
                handlePress={handleDestinationPress}
                textInputBackgroundColor="#1f201e"
              />
            </View>
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    </View>
  );
}
