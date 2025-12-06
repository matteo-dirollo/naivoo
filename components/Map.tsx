import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Platform, View } from "react-native";
import { useLocationStore, useTripStore } from "@/store";
import { calculateRegion } from "@/lib/map";
import { useEffect, useRef } from "react";
import LocationCluster from "@/components/LocationCluster";

const Map = () => {
  const mapRef = useRef<MapView>(null);
  const { currentUserLatitude, currentUserLongitude } = useLocationStore();
  const { activeTrip } = useTripStore();
  const region = calculateRegion({
    markers: activeTrip?.stops || [],
    userLatitude: currentUserLatitude,
    userLongitude: currentUserLongitude,
  });

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
        {currentUserLatitude != null && currentUserLongitude != null && (
          <Marker
            coordinate={{
              latitude: currentUserLatitude,
              longitude: currentUserLongitude,
            }}
          >
            <LocationCluster size="20" fill="#0075b2" />
          </Marker>
        )}
      </MapView>
    </View>
  );
};
export default Map;

// We weren't using react-native-maps, but we ran into a similar situation with a custom implementation of animating markers on a map. What made the animation a lot smoother was setting the animation time to equal the interval we were sending location data through the websocket. That way the marker would be finishing its animation to the previous lat/lon just as the new lat/lon value was provided. This allowed for continuously smooth animation (as long as data was still being provided on the websocket).
