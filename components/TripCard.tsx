import { View } from "react-native";
import { Trip } from "@/types/type";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { icons } from "@/constants";
import { formatDate, formatTime } from "@/lib/utils";

const TripCard = ({
  trip: {
    start_address,
    start_latitude,
    start_longitude,
    stops,
    optimized_order,
    created_at,
    total_duration_min,
    total_distance_km,
    name,
  },
}: {
  trip: Trip;
}) => {
  // Get the ID of the second-to-last stop from the optimized order.
  // This checks if there are at least two stops.
  const secondLastStopId =
    optimized_order?.length >= 2
      ? optimized_order[optimized_order.length - 2]
      : null;

  // Find the corresponding stop object from the stops array using the ID.
  const secondLastStop = secondLastStopId
    ? stops.find((stop) => stop.stop_id === secondLastStopId)
    : null;
  return (
    <View className="flex flex-row items-center justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 mb-3">
      <View className="flex flex-col item-center justify-center p-3">
        <View className="flex flex-row items-center justify-between">
          <Image
            size="md"
            source={{
              uri: `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${start_longitude},${start_latitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`,
            }}
            alt={"Map Preview"}
            className="w-[80px] h-[90px] rounded-lg"
          />
          <View className="flex flex-col mx-5 gap-y-5 flex-1">
            <View className="flex flex-row items-center gap-x-2">
              <Image alt={"Icon"} source={icons.to} className="w-5 h-5" />
              <Text numberOfLines={1} className={"text-md"}>
                {start_address}
              </Text>
            </View>
            <View className="flex flex-row items-center gap-x-2">
              <Image alt={"Icon"} source={icons.point} className="w-5 h-5" />
              <Text numberOfLines={1} className={"text-md"}>
                {secondLastStop ? secondLastStop.address : "N/A"}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex flex-col w-full mt-5 bg-general-500 rounded-lg p-3 items-start justify-center">
          <View className="flex flex-row items-center w-full justify-between mb-5">
            <Text className="text-md font-bold text-gray-500">Date & Time</Text>
            <Text className="text-md font-bold text-gray-500">
              {formatDate(created_at)}, {formatTime(total_duration_min)}
            </Text>
          </View>
          <View className="flex flex-row items-center w-full justify-between mc-5">
            <View className="flex flex-row items-center w-full justify-between mb-5">
              <Text className="text-md font-bold text-gray-500">Distance</Text>
              <Text className="text-md font-bold text-gray-500">
                {total_distance_km} Km
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
export default TripCard;
