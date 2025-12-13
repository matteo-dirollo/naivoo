import { Text, View } from "react-native";
import {
  BottomSheetView,
  BottomSheetVirtualizedList,
} from "@gorhom/bottom-sheet";
import { TripMarker } from "@/types/type";

interface StopsListProps {
  stops: TripMarker[];
}

export const FlashList = (stops: StopsListProps) => {
  const keyExtractor = (item: TripMarker) => item.stop_id;

  const renderItem = ({ item }: { item: TripMarker }) => {
    const isUser = item.isUserLocation;

    return (
      <View
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#444",
          backgroundColor: isUser ? "#0d3b66" : "#141714",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: isUser ? "bold" : "normal" }}>
          {isUser ? "📍 " : ""}
          {item.address}
        </Text>
      </View>
    );
  };

  // @ts-ignore
  return (
    <BottomSheetView className="flex-1 pt-200">
      <BottomSheetVirtualizedList
        data={stops}
        keyExtractor={keyExtractor}
        getItemCount={(data: any) => data.length}
        getItem={(data: any, index: number) => data[index]}
        renderItem={renderItem}
        // estimatedItemSize={50}
      />
    </BottomSheetView>
  );
};
