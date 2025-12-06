import React from "react";
import Svg, { Circle } from "react-native-svg";
import { View } from "react-native";

// @ts-ignore
export default function LocationCluster({ size, fill }) {
  return (
    <View>
      <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        {/* Main circle */}
        <Circle cx="30" cy="30" r="18" fill="#0075b2" />

        {/* Opacity .5 */}
        <Circle cx="30" cy="30" r="24" fill={fill} fillOpacity="0.5" />

        <Circle cx="30" cy="30" r="30" fill={fill} fillOpacity="0.2" />
      </Svg>
    </View>
  );
}
