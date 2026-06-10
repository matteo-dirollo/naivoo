import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
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
    <View style={styles.container}>
      {/* Toggle tilt / overview */}
      <TouchableOpacity
        style={[styles.button, isNavigation && styles.buttonActive]}
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

      {/* Recenter */}
      <TouchableOpacity
        style={styles.button}
        onPress={onRecenter}
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Crosshair size={18} color="#ffffff" strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    alignItems: "center",
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(20,23,20,0.88)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(132,144,129,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: "#1ed7b5",
    borderColor: "#1ed7b5",
  },
});

export default MapViewControls;
