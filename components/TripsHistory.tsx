import React, { useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useTripStore } from "@/store";
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
          <TouchableOpacity
            className="p-4 mb-2 bg-brand-50 rounded-lg"
            onPress={() => setActiveTrip(item.trip_id)}
          >
            <Text className="font-semibold text-background-900  ">
              {item.name || "Unnamed Journey"}
            </Text>
          </TouchableOpacity>
        )}
      />
      <Text className="text-sm text-primary-100">Max shown: 30</Text>
    </View>
  );
};

export default TripsHistory;
