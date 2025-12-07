import React, {useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFetch } from "@/lib/fetch";
import { Trip } from "@/types/type";
import Map from "@/components/Map";
import { useLocationStore } from "@/store";
import {googleReverseGeocode} from "@/lib/utils";
import SheetContent from "@/components/BottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import {Button, View} from "react-native";
import {Portal} from "@gorhom/portal";

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
                    address = [await googleReverseGeocode(pos.coords.latitude, pos.coords.longitude)];
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
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    // router.push("/(root)/find-ride");
  };

    const snapPoints = useMemo(() => ["25%", "50%"], []);

    const openSheet = useCallback(() => {
        sheetRef.current?.expand();
    }, []);

  return (
    <SafeAreaView edges={['right', 'left']} className="bg-general-500">
      <Map style={{ zIndex: -1 }} />
        <Button title="Open Bottom Sheet" onPress={openSheet} />
        <Portal>
            <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints}>
                <View style={{ flex: 1, alignItems: "center", padding: 20 }}>
                    <Text>Hello from inside a portal bottom sheet!</Text>
                </View>
            </BottomSheet>
        </Portal>
    </SafeAreaView>
  );
}
