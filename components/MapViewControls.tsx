import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Layers, Crosshair } from "lucide-react-native";
import { MapViewMode } from "@/types/type";

interface MapViewControlsProps {
  viewMode: MapViewMode;
  onToggleView: () => void;
  onRecenter: () => void;
}

const MapViewControls: React.FC<MapViewControlsProps> = ({
  viewMode,
  onToggleView,
  onRecenter,
}) => {
  const isNavigation = viewMode === "navigation";

  return (
    <View className="gap-2 items-center">
      <TouchableOpacity
        className={`w-10 h-10 rounded-full items-center justify-center border ${
          isNavigation
            ? "bg-[#1ed7b5] border-[#1ed7b5]"
            : "bg-[rgba(20,23,20,0.88)] border-[rgba(132,144,129,0.25)]"
        }`}
        onPress={onToggleView}
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Layers
          size={18}
          color={isNavigation ? "#141714" : "#ffffff"}
          strokeWidth={1.8}
        />
      </TouchableOpacity>

      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-[rgba(20,23,20,0.88)] items-center justify-center border border-[rgba(132,144,129,0.25)]"
        onPress={onRecenter}
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Crosshair size={18} color="#ffffff" strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  );
};

export default MapViewControls;
