import React from "react";
import Svg, { Defs, LinearGradient, Stop, Path, Text } from "react-native-svg";
import { View } from "react-native";

// @ts-ignore
export default function StopMarker({ width, height, text }) {
  return (
    <View>
      <Svg
        viewBox="0 0 821.52 1016.08"
        width={width || 200}
        height={height || 200}
      >
        <Defs>
          <LinearGradient
            id="linear-gradient"
            x1="146.54"
            y1="868.83"
            x2="616.36"
            y2="55.08"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#1ed7b5" />
            <Stop offset="1" stopColor="#f4e900" />
          </LinearGradient>
        </Defs>

        <Path
          d="M811.02,410.76c0-219.71-177.02-398.07-396.22-400.24C194.26,8.34,11.86,187.69,10.51,408.24c-.98,159.4,91.23,297.35,225.34,362.61,23,11.19,42.38,28.65,55.17,50.8l99.41,172.19c9.03,15.65,31.62,15.65,40.65,0l99.42-172.2c12.46-21.58,30.97-39.16,53.43-49.96,134.34-64.57,227.08-201.91,227.08-360.93Z"
          fill="#fff"
          stroke="url(#linear-gradient)"
          strokeWidth={21}
          strokeMiterlimit={10}
        />

        <Text
          x={302.87}
          y={522.02}
          fill="#1ed7b5"
          fontFamily="Helvetica"
          fontSize={388}
        >
          {text}
        </Text>
      </Svg>
    </View>
  );
}
