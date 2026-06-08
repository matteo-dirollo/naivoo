import { Pressable, Text, useWindowDimensions, View } from "react-native";
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { DraggableListProps, TripMarker } from "@/types/type";
import { Grip, MapPinHouse, Lock, RefreshCw } from "lucide-react-native";
import { useMemo, useRef } from "react";
import { useTripStore } from "@/store";
import FlatListItemMenu from "@/components/FlatListItemMenu";
import { Heading } from "@/components/ui/heading";

export const DraggableList = ({
  stops,
  onReorder,
  snapPoints,
  snapIndex,
  searchInputHeight,
  onDragStart,
  onDragEndGlobal,
}: DraggableListProps) => {
  const { height: windowHeight } = useWindowDimensions();
  const { activeTrip } = useTripStore();
  const { userLocation, draggableStops } = useMemo(() => {
    const user = stops.find((stop) => stop.isUserLocation);
    const draggable = stops.filter((stop) => !stop.isUserLocation);
    return { userLocation: user, draggableStops: draggable };
  }, [stops]);
  const draggedStopIdRef = useRef<string | null>(null);

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

    return Math.max(calculatedHeight, 100);
  }, [snapIndex, snapPoints, windowHeight, searchInputHeight]);

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<TripMarker>) => {
    return (
      <View
        className={`flex-row items-center px-2 border-b border-b-background-800 bg-background-950 z-0 ${
          isActive ? "opacity-50" : ""
        }`}
      >
        <Pressable
          onLongPress={drag}
          delayLongPress={150}
          disabled={isActive}
          hitSlop={20}
          className="p-5 justify-center items-center min-w-[16] min-h-[16]"
        >
          <Grip strokeWidth={1} size={16} color={"#fff"} />
        </Pressable>
        <View className="mr-4" />
        <Text
          className="text-background-300 flex-1 font-normal"
          numberOfLines={2}
        >
          {item.location.address}
        </Text>
        {item.isPrioritized && (
          <View className="mr-1">
            <Lock strokeWidth={1} size={12} color={"#1ed7b5"} />
          </View>
        )}

        <View className="px-2 justify-center items-center min-w-[16] min-h-[12]">
          <FlatListItemMenu menuId={item.stop_id} />
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!userLocation) return null;

    return (
      <View className="flex items-start border-b border-b-[#444] px-3 pt-3 gap-4 mt-2 z-0">
        <View className="flex w-full">
          <Heading className="text-background-500 px-3 my-2">
            {activeTrip?.name || "Untitled Trip"}
          </Heading>
          <View
            style={{ marginHorizontal: -16 }}
            className="bg-background-900 px-8 py-2 mb-1"
          >
            <Text className="font-semibold text-background-500 text-sm uppercase tracking-widest">
              Route Setup
            </Text>
          </View>
        </View>
        <View className="flex-row justify-center items-center min-w-[16] min-h-[8] mx-4 gap-8">
          <MapPinHouse
            color="#fff"
            strokeWidth={1}
            className="text-background-300 w-6 h-6"
          />

          <Text
            className="text-background-300 flex-1 font-normal"
            numberOfLines={2}
          >
            Start from current location
          </Text>
        </View>
        <View className="flex-row justify-center items-center min-w-[16] min-h-[8] mx-4 gap-8">
          <RefreshCw
            color="#fff"
            strokeWidth={1}
            className="text-background-300 w-6 h-6"
          />
          <Text className="text-background-300 flex-1 font-normal">
            Round Trip
          </Text>
        </View>
        <View className="flex w-full">
          <View
            style={{ marginHorizontal: -16 }}
            className="bg-background-900 px-8 py-2"
          >
            <Text className="font-semibold text-background-500 text-sm uppercase tracking-widest">
              Stops
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const handleDragEnd = ({ data }: { data: TripMarker[] }) => {
    // Reconstruct the full list with user location at the top
    const fullList = userLocation ? [userLocation, ...data] : data;
    onReorder(fullList, draggedStopIdRef.current ?? undefined);
    draggedStopIdRef.current = null;
  };

  return (
    <NestableScrollContainer
      className="flex-1 z-0"
      style={{ maxHeight: maxScrollHeight }}
    >
      <>{renderHeader()}</>
      {/* @ts-ignore - NestableDraggableFlatList works inside NestableScrollContainer despite type warning */}
      <NestableDraggableFlatList
        data={draggableStops}
        keyExtractor={(item) => item.stop_id}
        renderItem={renderItem}
        onDragBegin={(index) => {
          // Record which stop is being dragged
          draggedStopIdRef.current = draggableStops[index]?.stop_id ?? null;
          onDragStart?.();
        }}
        onDragEnd={({ data }) => {
          handleDragEnd({ data });
          onDragEndGlobal?.();
        }}
        containerStyle={{ flex: 1 }}
        // activationDistance={20}
        // dragHitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        showsVerticalScrollIndicator={true}
      />
    </NestableScrollContainer>
  );
};
