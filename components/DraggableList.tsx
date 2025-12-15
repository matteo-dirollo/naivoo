import { Pressable, Text, useWindowDimensions, View } from "react-native";
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { TripMarker } from "@/types/type";
import { GripVerticalIcon, Icon } from "@/components/ui/icon";
import { MapPinHouse } from "lucide-react-native";
import { useMemo } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

interface DraggableListProps {
  stops: TripMarker[];
  onReorder: (newStops: TripMarker[]) => void;
  snapIndex: number;
  snapPoints: (string | number)[];
  searchInputHeight?: any;
}

export const DraggableList = ({
  stops,
  onReorder,
  snapPoints,
  snapIndex,
  searchInputHeight,
}: DraggableListProps) => {
  const { height: windowHeight } = useWindowDimensions();
  const { userLocation, draggableStops } = useMemo(() => {
    const user = stops.find((stop) => stop.isUserLocation);
    const draggable = stops.filter((stop) => !stop.isUserLocation);
    return { userLocation: user, draggableStops: draggable };
  }, [stops]);

  const maxScrollHeight = useMemo(() => {
    const arrayIndex = snapIndex - 1;
    if (
      !snapPoints ||
      snapPoints.length === 0 ||
      arrayIndex < 0 ||
      arrayIndex >= snapPoints.length
    ) {
      console.warn("Invalid snapIndex or snapPoints:", {
        snapIndex,
        arrayIndex,
        snapPoints,
      });
      return 300;
    }
    const currentSnapPoint = snapPoints[arrayIndex];

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
    const reservedSpace = searchInputHeight || 120;
    const calculatedHeight = sheetHeight - reservedSpace;

    // console.log("Sheet calculation:", {
    //   snapIndex,
    //   arrayIndex,
    //   currentSnapPoint,
    //   windowHeight,
    //   sheetHeight,
    //   searchInputHeight,
    //   reservedSpace,
    //   calculatedHeight,
    // });

    return Math.max(calculatedHeight, 100);
  }, [snapIndex, snapPoints, windowHeight, searchInputHeight]);

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<TripMarker>) => {
    return (
      <View
        className={`flex-row items-center p-3 border-b border-b-[#444] bg-[#141714] ${
          isActive ? "opacity-50" : ""
        }`}
      >
        <Pressable
          onTouchStart={drag}
          onLongPress={drag}
          delayLongPress={0}
          className="mr-4 p-5 justify-center items-center min-w-[14] min-h-[14]"
        >
          <Icon as={GripVerticalIcon} className="text-[#ccc] w-6 h-6" />
        </Pressable>
        <View className="mr-4" />
        <Text className={`text-white flex-1 font-normal`} numberOfLines={2}>
          {item.address}
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!userLocation) return null;

    return (
      <View className="flex-row items-center border-b border-b-[#444] bg-[#0d3b66] p-3">
        <View className="mr-4 p-5 justify-center items-center min-w-[14] min-h-[14]">
          <MapPinHouse
            color="#fff"
            strokeWidth={1}
            className="text-[#ccc] w-6 h-6"
          />
        </View>
        <View className="mr-4" />
        <Text className="text-white flex-1 font-bold" numberOfLines={2}>
          {userLocation.address}
        </Text>
      </View>
    );
  };

  const handleDragEnd = ({ data }: { data: TripMarker[] }) => {
    // Reconstruct the full list with user location at the top
    const fullList = userLocation ? [userLocation, ...data] : data;
    onReorder(fullList);
  };

  return (
    <BottomSheetScrollView>
      <NestableScrollContainer
        className="flex-1 my-2"
        style={{ maxHeight: maxScrollHeight }}
      >
        {renderHeader()}

        <NestableDraggableFlatList
          data={draggableStops}
          keyExtractor={(item) => item.stop_id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          containerStyle={{ flex: 1 }}
          activationDistance={20}
          dragHitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          showsVerticalScrollIndicator={true}
        />
      </NestableScrollContainer>
    </BottomSheetScrollView>
  );
};
