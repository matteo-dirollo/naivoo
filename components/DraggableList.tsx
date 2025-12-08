import { View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useTripStore } from "@/store";
import { TripMarker } from "@/types/type";

interface DraggableList {
    stops: TripMarker[];
    onReorder: (newStops: TripMarker[]) => void;
}

export const DraggableList = ({ stops, onReorder }: DraggableList) => {
    return (
        <View className="flex-1">
            <DraggableFlatList
                data={stops}
                keyExtractor={(item) => item.stop_id}
                renderItem={({ item, drag, isActive }) => (
                    <View
                        className={`p-3 border-b border-gray-700 ${
                            isActive ? "bg-gray-800" : "bg-[#141714]"
                        }`}
                        onLongPress={drag}
                    >
                        <Text className="text-white">{item.address}</Text>
                    </View>
                )}
                onDragEnd={({ data }) => onReorder(data)}
            />
        </View>
    );
};
