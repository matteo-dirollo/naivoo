import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import { SignedIn, useAuth, useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import TripCard from "@/components/TripCard";
import { Image } from "@/components/ui/image";
import { icons, images } from "@/constants";
import { router } from "expo-router";
import GoogleTextInput from "@/components/GoogleTextInput";
import { useFetch } from "@/lib/fetch";
import { Trip } from "@/types/type";
import Map from "@/components/Map";
import { useLocationStore } from "@/store";

const trips = [
  {
    trip_id: "1",
    user_id: "1",
    name: "Daily Errands",
    start_address: "Via Roma 10, Milano, Italy",
    start_latitude: "45.464211",
    start_longitude: "9.191383",

    stops: [
      {
        stop_id: "s1",
        trip_id: "1",
        address: "Via Torino 5, Milano, Italy",
        latitude: "45.459123",
        longitude: "9.183991",
      },
      {
        stop_id: "s2",
        trip_id: "1",
        address: "Corso Buenos Aires 33, Milano, Italy",
        latitude: "45.478012",
        longitude: "9.205123",
      },
      {
        stop_id: "s3",
        trip_id: "1",
        address: "Viale Monza 120, Milano, Italy",
        latitude: "45.509123",
        longitude: "9.221733",
      },
    ],

    return_to_start: true,

    // Returned from Google Directions "optimize:true"
    optimized_order: ["s1", "s3", "s2"],

    total_distance_km: 14.3,
    total_duration_min: 42,

    created_at: "2024-08-12 10:19:20.620007",
  },
  {
    trip_id: "2",
    user_id: "1",
    name: "Delivery Route",
    start_address: "Piazza Garibaldi, Napoli, Italy",
    start_latitude: "40.852181",
    start_longitude: "14.268110",

    stops: [
      {
        stop_id: "s1",
        trip_id: "2",
        address: "Via Toledo 220, Napoli, Italy",
        latitude: "40.846578",
        longitude: "14.249221",
      },
      {
        stop_id: "s2",
        trip_id: "2",
        address: "Via dei Tribunali 138, Napoli, Italy",
        latitude: "40.852992",
        longitude: "14.261882",
      },
    ],

    return_to_start: false,

    optimized_order: ["s2", "s1"],

    total_distance_km: 6.8,
    total_duration_min: 21,

    created_at: "2024-08-12 11:02:17.683046",
  },
  {
    trip_id: "3",
    user_id: "1",
    name: "Tourist Path in Paris",
    start_address: "Eiffel Tower, Paris",
    start_latitude: "48.858373",
    start_longitude: "2.292292",

    stops: [
      {
        stop_id: "s1",
        trip_id: "3",
        address: "Arc de Triomphe, Paris",
        latitude: "48.873792",
        longitude: "2.295028",
      },
      {
        stop_id: "s2",
        trip_id: "3",
        address: "Louvre Museum, Paris",
        latitude: "48.860611",
        longitude: "2.337644",
      },
      {
        stop_id: "s3",
        trip_id: "3",
        address: "Notre-Dame Cathedral, Paris",
        latitude: "48.8530",
        longitude: "2.3499",
      },
    ],

    return_to_start: true,

    optimized_order: ["s1", "s2", "s3"],

    total_distance_km: 10.1,
    total_duration_min: 34,

    created_at: "2024-08-12 14:49:01.809053",
  },
];

export default function Home() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const { setCurrentUserLocation } = useLocationStore();
  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const {
    // data: recentTrips,
    // loading,
    error,
  } = useFetch<Trip[]>(`/(api)/trip/${user?.id}`);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords?.latitude!,
        longitude: location.coords?.longitude!,
      });

      setCurrentUserLocation({
        latitude: location.coords?.latitude,
        longitude: location.coords?.longitude,
        address: `${address[0].name}, ${address[0].region}`,
      });
    })();
  }, []);

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    // setDestinationLocation(location);
    // router.push("/(root)/find-ride");
  };

  return (
    <SafeAreaView className="bg-general-500">
      <FlatList
        data={trips?.slice(0, 5)}
        renderItem={({ item }) => <TripCard trip={item} />}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="no recent routes found"
                  resizeMode={"contain"}
                />
                <Text className="text-sm">No recent trips found</Text>
              </>
            ) : (
              <ActivityIndicator size={"small"} color={"#000"} />
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <>
            <View className="flex flex-row items-center justify-center my-5">
              <Text className={"text-2xl text-weight-bold capitalize"}>
                Welcome{", "}
                {user?.firstName ||
                  user?.emailAddresses[0].emailAddress.split("@")[0]}
              </Text>
              <TouchableOpacity
                onPress={handleSignOut}
                className={"justify-center items-center w-10 h-10 rounded-full"}
              >
                <Image
                  alt={"icon out"}
                  source={icons.out}
                  className={"w-4 h-4"}
                />
              </TouchableOpacity>
            </View>
            <GoogleTextInput
              icon={icons.search}
              containerStyle={"bg-white shadow-md shadow-neutral-300"}
              handlePress={handleDestinationPress}
            />
            <Text className={"text-xl font-bold mt-5 mb-3"}>
              Your Current Location
            </Text>
            <View
              className={"flex flex-row items-center bg-transparent h-[300px]"}
            >
              <Map />
            </View>
          </>
        )}
      />
    </SafeAreaView>
  );
}
