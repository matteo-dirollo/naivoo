import React, { useEffect } from "react";
import { useDrawerStore, useMenuStore, useTripStore } from "@/store";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { Heading } from "@/components/ui/heading";
import FlatListItemMenu from "@/components/FlatListItemMenu";

interface TripsHistoryProps {
  userId: string; // Pass the logged-in user's ID to fetch their trips
}
const TripsHistory = ({ userId }: TripsHistoryProps) => {
  const userTrips = useTripStore((state) => state.userTrips);
  const fetchUserTrips = useTripStore((state) => state.fetchUserTrips);
  const { setActiveTrip } = useTripStore();
  const setDrawerOpen = useDrawerStore((state) => state.setDrawerOpen);
  const toggleMenu = useMenuStore((state) => state.toggleMenu);

  useEffect(() => {
    if (userId) {
      fetchUserTrips(userId);
    }
  }, [userId]);

  return (
    <View className="flex-1 w-full">
      <Heading className="text-lg font-semibold text-white mb-2">
        Latest Trips
      </Heading>
      <FlatList
        data={userTrips} // Renders the data currently stored in memory
        keyExtractor={(item) => item.trip_id}
        renderItem={({ item }) => (
          <View className="flex w-full mb-2">
            <View className="flex-row items-center justify-between w-full">
              <TouchableOpacity
                className="p-4 mb-2 bg-brand-50 rounded-lg w-full"
                onPress={() => {
                  setActiveTrip(item.trip_id);
                  setDrawerOpen("main-nav", false);
                }}
                onLongPress={() => {
                  // hold for ~500ms
                  toggleMenu(item.trip_id, "trip", true);
                }}
              >
                <Text className="font-semibold text-background-900  ">
                  {item.name || "Unnamed Journey"}
                </Text>
              </TouchableOpacity>
              <FlatListItemMenu menuId={item.trip_id} menuType="trip" />
            </View>
          </View>
        )}
      />
      <Text className="text-sm text-primary-100">Max shown: 30</Text>
    </View>
  );
};

export default TripsHistory;
