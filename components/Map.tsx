import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Platform, View } from "react-native";
import { useLocationStore } from "@/store";
import { calculateRegion } from "@/lib/map";
import {useEffect, useRef, useState} from "react";

const Map = () => {
    const mapRef = useRef<MapView>(null);
  const { currentUserLatitude, currentUserLongitude } = useLocationStore();
    const region = calculateRegion({ markers, userLatitude: currentUserLatitude, userLongitude: currentUserLongitude });

    useEffect(() => {
        if (mapRef.current && region) {
            mapRef.current.animateToRegion(region, 800); // Animate to the calculated region
        }
    }, [region]); // Re-run effect when region changes

  return (
    <View className="w-full h-full rounded-2xl">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        tintColor="Black"
        mapType="standard"
        showsPointsOfInterest={false}
        region={region}
      >
        <Marker
          coordinate={{
            latitude: currentUserLatitude,
            longitude: currentUserLongitude,
          }}
        />
      </MapView>
    </View>
  );
};
export default Map;
