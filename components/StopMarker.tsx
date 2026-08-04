import React from "react";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Text,
  Circle,
} from "react-native-svg";
import { View } from "react-native";

interface StopMarkerProps {
  width: number;
  height: number;
  text: any;
  highlight?: boolean;
  done?: boolean;
  skipped?: boolean;
}

export default function StopMarker({
  width,
  height,
  text,
  highlight = false,
  done = false,
  skipped = false,
}: StopMarkerProps) {
  const gradientStart = done
    ? "#4a4a4a"
    : skipped
      ? "#6b4a00"
      : highlight
        ? "#ffffff"
        : "#1ed7b5";

  const gradientEnd = done
    ? "#2a2a2a"
    : skipped
      ? "#3a2800"
      : highlight
        ? "#1ed7b5"
        : "#f4e900";

  const textColor = done
    ? "#6a6a6a"
    : skipped
      ? "#a06000"
      : highlight
        ? "#1ed7b5"
        : "#1ed7b5";

  return (
    <View
      style={{
        width,
        height,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/*
        viewBox matches the exact geometry of your SVG shape with extra padding
        (-50 on all sides) so strokes and glow rings never hit the outer edge.
      */}
      <Svg viewBox="-50 -50 921.52 1116.08" width="100%" height="100%">
        <Defs>
          <LinearGradient
            id="marker-gradient"
            x1="146.54"
            y1="868.83"
            x2="616.36"
            y2="55.08"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={gradientStart} />
            <Stop offset="1" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>

        {/* Highlight ring for current stop */}
        {highlight && (
          <Circle cx="410" cy="410" r="430" fill="rgba(30,215,181,0.2)" />
        )}

        <Path
          d="M811.02,410.76c0-219.71-177.02-398.07-396.22-400.24C194.26,8.34,11.86,187.69,10.51,408.24c-.98,159.4,91.23,297.35,225.34,362.61,23,11.19,42.38,28.65,55.17,50.8l99.41,172.19c9.03,15.65,31.62,15.65,40.65,0l99.42-172.2c12.46-21.58,30.97-39.16,53.43-49.96,134.34-64.57,227.08-201.91,227.08-360.93Z"
          fill="#fff"
          stroke="url(#marker-gradient)"
          strokeWidth={highlight ? 32 : 21}
          strokeMiterlimit={10}
        />

        {/*
          Centered Text Position:
          x={410} with textAnchor="middle" aligns single and double digit numbers horizontally.
          y={540} places the font baseline exactly inside the pin head bubble.
        */}
        <Text
          x={410}
          y={540}
          fill={textColor}
          fontSize={380}
          fontWeight="bold"
          textAnchor="middle"
        >
          {String(text)}
        </Text>
      </Svg>
    </View>
  );
}
