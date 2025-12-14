import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Sortable,
  SortableItem,
  SortableRenderItemProps,
} from "react-native-reanimated-dnd";
import { TripMarker } from "@/types/type";
import { GripVerticalIcon, Icon } from "@/components/ui/icon";
import { useAnimatedScrollHandler } from "react-native-reanimated";

interface FlashListProps {
  stops: TripMarker[];
  onReorder: (newOrder: TripMarker[]) => void;
}

export const FlashList = ({ stops, onReorder }: FlashListProps) => {
  const [data, setData] = useState<TripMarker[]>(stops);
  const [isReordering, setIsReordering] = useState(false);

  /**
   * Keep local state in sync if stops change externally
   */
  useEffect(() => {
    setData(stops);
  }, [stops]);

  /**
   * CORE REORDER LOGIC
   * (drop-in ready for Zustand later)
   */
  const handleMove = useCallback(
    (itemId: string, from: number, to: number) => {
      if (from === to) return;

      setData((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);

        onReorder(next);
        return next;
      });
    },
    [onReorder],
  );

  const renderSortableItem = useCallback(
    ({
      item,
      id,
      positions,
      ...props
    }: SortableRenderItemProps<TripMarker>) => {
      const isUser = item.isUserLocation;

      return (
        <SortableItem
          key={id}
          id={id}
          positions={positions}
          data={data}
          {...props}
          onMove={handleMove}
          onDragStart={() => setIsReordering(true)}
          onDrop={() => setIsReordering(false)}
        >
          <View
            className={[
              "flex-row items-center px-3 py-3",
              "border-b border-neutral-700",
              isUser ? "bg-blue-900" : "bg-neutral-900",
              isReordering ? "opacity-80" : "opacity-100",
            ].join(" ")}
          >
            {/* DRAG HANDLE (only if not user location) */}
            {!isUser && (
              <SortableItem.Handle className="mr-3 p-1">
                <Icon
                  as={GripVerticalIcon}
                  className="w-[18px] h-[18px] text-neutral-300"
                />
              </SortableItem.Handle>
            )}

            {/* TEXT */}
            <Text
              className={[
                "text-white",
                isUser ? "font-bold" : "font-normal",
              ].join(" ")}
              numberOfLines={2}
            >
              {isUser ? "📍 " : ""}
              {item.address}
            </Text>
          </View>
        </SortableItem>
      );
    },
    [handleMove, isReordering, data],
  );

  return (
    <Sortable
      data={data}
      renderItem={renderSortableItem}
      itemHeight={80}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};
