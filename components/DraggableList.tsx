import { Text, View} from "react-native";
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
} from "react-native-draggable-flatlist";
import { TripMarker } from "@/types/type";
import { GripVerticalIcon, Icon } from "@/components/ui/icon";

interface DraggableListProps {
  stops: TripMarker[];
  onReorder: (newStops: TripMarker[]) => void;
}

interface DraggableListProps {
    stops: TripMarker[];
    onReorder: (data: TripMarker[]) => void;  // callback to update order
}

export const DraggableList = ({ stops, onReorder }: DraggableListProps) => {
    const renderItem = ({ item, isActive }) => {
        const isUser = item.isUserLocation;

        return (
            <View
                className={`flex-row items-center p-3 border-b border-b-[#444] ${
                    isActive ? "opacity-50" : ""
                }`}
                style={{
                    backgroundColor: isUser ? "#0d3b66" : "#141714",
                }}
            >
                {!isUser && (
                    <Icon
                        as={GripVerticalIcon}
                        className="mr-4 text-[#ccc] w-4 h-4"
                    />
                )}
                <Text
                    className={`text-white ${
                        isUser ? "font-bold" : "font-normal"
                    }`}
                >
                    {isUser ? "📍 " : ""}
                    {item.address}
                </Text>
            </View>
        );
    };
  return (
      <NestableScrollContainer className="flex-1 mx-4">
          <NestableDraggableFlatList
              data={stops}
              keyExtractor={(item) => item.stop_id}
              renderItem={renderItem}
              onDragEnd={({ data }) => onReorder(data)}
          />
      </NestableScrollContainer>
  );
};
