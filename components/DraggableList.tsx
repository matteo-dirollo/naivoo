import { Text } from "react-native";
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

export const DraggableList = ({ stops, onReorder }: DraggableListProps) => {
  return (
    <NestableScrollContainer className="flex-1">
      <NestableDraggableFlatList
        data={stops}
        keyExtractor={(item) => item.stop_id}
        renderItem={({ item, isActive }) => {
          const isUser = item.isUserLocation;

          return (
            <Text
              className={`p-3 border-b border-gray-700 text-white ${
                isUser
                  ? "bg-blue-900 font-bold"
                  : isActive
                    ? "bg-gray-800"
                    : "bg-[#141714]"
              }`}
            >
              {isUser ? "📍 " : ""}
              {item.address}
            </Text>
          );
        }}
        onDragEnd={({ data }) => onReorder(data)}
      />
      <Icon as={GripVerticalIcon} className="text-typography-500 m-2 w-4 h-4" />
    </NestableScrollContainer>
  );
};
