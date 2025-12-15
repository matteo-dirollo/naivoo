import { Text, useWindowDimensions, View } from "react-native";
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { TripMarker } from "@/types/type";
import { GripVerticalIcon, Icon } from "@/components/ui/icon";
import { useMemo } from "react";

interface DraggableListProps {
  stops: TripMarker[];
  onReorder: (newStops: TripMarker[]) => void;
  snapIndex: number; // Current snap point index
  snapPoints: (string | number)[]; // Array of snap points
}

export const DraggableList = ({
  stops,
  onReorder,
  snapPoints,
  snapIndex,
}: DraggableListProps) => {
  const { height: windowHeight } = useWindowDimensions();
  const maxScrollHeight = useMemo(() => {
    const currentSnapPoint = snapPoints[snapIndex];

    let sheetHeight: number;
    if (
      typeof currentSnapPoint === "string" &&
      currentSnapPoint.endsWith("%")
    ) {
      const percentage = parseFloat(currentSnapPoint) / 100;
      sheetHeight = windowHeight * percentage;
    } else {
      sheetHeight = Number(currentSnapPoint);
    }
    const reservedSpace = 120;

    return sheetHeight - reservedSpace;
  }, [snapIndex, snapPoints, windowHeight]);

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
    <NestableScrollContainer
      className="flex-1 my-2"
      style={{ maxHeight: maxScrollHeight }}
    >
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
