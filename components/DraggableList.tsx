import { Text, View } from "react-native";
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { TripMarker } from "@/types/type";
import { GripVerticalIcon, Icon } from "@/components/ui/icon";

interface DraggableListProps {
  stops: TripMarker[];
  onReorder: (newStops: TripMarker[]) => void;
}

export const DraggableList = ({ stops, onReorder }: DraggableListProps) => {
  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<TripMarker>) => {
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
          <View onTouchStart={drag} className="mr-4 p-1">
            <Icon as={GripVerticalIcon} className="text-[#ccc] w-4 h-4" />
          </View>
        )}
        <Text
          className={`text-white flex-1 ${isUser ? "font-bold" : "font-normal"}`}
        >
          {isUser ? "📍 " : ""}
          {item.address}
        </Text>
      </View>
    );
  };

  return (
    <NestableScrollContainer style={{ flex: 1 }}>
      <NestableDraggableFlatList
        data={stops}
        keyExtractor={(item) => item.stop_id}
        renderItem={renderItem}
        onDragEnd={({ data }) => onReorder(data)}
        containerStyle={{ flex: 1 }}
      />
    </NestableScrollContainer>
  );
};
