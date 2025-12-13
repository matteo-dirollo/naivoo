import React, { useState, useCallback } from "react";
import { Text, View } from "react-native";
import { Sortable, SortableItem, SortableRenderItemProps } from "react-native-reanimated-dnd";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { TripMarker } from "@/types/type";
import { GripVerticalIcon, Icon } from "@/components/ui/icon";

interface FlashListProps {
    stops: TripMarker[];
    onReorder: (newOrder: TripMarker[]) => void;
}

export const FlashList = ({ stops, onReorder }: FlashListProps) => {
    const [data, setData] = useState(stops);

    // update order in external state when drop completes
    const handleMove = useCallback((itemId: string, from: number, to: number) => {
        const newData = [...data];
        const [moved] = newData.splice(from, 1);
        newData.splice(to, 0, moved);
        setData(newData);
        onReorder(newData);
    }, [data, onReorder]);

    const renderSortableItem = ({ item, id, positions, ...props }: SortableRenderItemProps<TripMarker>) => {
        const isUser = item.isUserLocation;

        return (
            <SortableItem key={id} id={id} positions={positions} onMove={handleMove} {...props}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        backgroundColor: isUser ? "#0d3b66" : "#141714",
                        borderBottomWidth: 1,
                        borderBottomColor: "#444",
                    }}
                >
                    {!isUser && (
                        <Icon
                            as={GripVerticalIcon}
                            style={{ marginRight: 12, width: 18, height: 18, color: "#ccc" }}
                        />
                    )}
                    <Text style={{ color: "#fff", fontWeight: isUser ? "bold" : "normal" }}>
                        {isUser ? "📍 " : ""}
                        {item.address}
                    </Text>
                </View>
            </SortableItem>
        );
    };

    return (

            <Sortable
                data={data}
                renderItem={renderSortableItem}
                itemHeight={80}           // height you expect each item to take
                contentContainerStyle={{ paddingBottom: 20 }}
            />

    );
};
