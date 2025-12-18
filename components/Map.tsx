import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { View } from "react-native";
import { useUserLocationStore, useTripStore } from "@/store";
import { calculateRegion } from "@/lib/map";
import { useEffect, useRef } from "react";
import LocationCluster from "@/components/LocationCluster";
import StopMarker from "@/components/StopMarker";
import { darkMapStyle } from "@/constants";

const Map = () => {
  const mapRef = useRef<MapView>(null);
  const { currentUserLocation } = useUserLocationStore();
  const userLatitude = currentUserLocation?.latitude;
  const userLongitude = currentUserLocation?.longitude;
  const { activeTrip } = useTripStore();
  const region = calculateRegion({
    markers: activeTrip?.stops || [],
    userLatitude: userLatitude,
    userLongitude: userLongitude,
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
        customMapStyle={darkMapStyle}
        mapType="standard"
        showsPointsOfInterest={false}
        region={region}
      >
        {userLatitude != null && userLongitude != null && (
          <Marker
            coordinate={{
              latitude: userLatitude,
              longitude: userLongitude,
            }}
          >
            <LocationCluster size="20" fill="#0075b2" />
          </Marker>
        )}

        {/* Trip Markers - Filter out user location stop */}
        {activeTrip?.stops
          ?.filter((stop) => !stop.isUserLocation)
          .map((stop, index) => (
            <Marker
              key={stop.stop_id}
              coordinate={{
                latitude: stop.location.latitude,
                longitude: stop.location.longitude,
              }}
              title={stop.location.address}
            >
              <StopMarker width="40" height="40" text={index + 1} />
            </Marker>
          ))}
      </MapView>
    </View>
  );
};
export default Map;

// We weren't using react-native-maps, but we ran into a similar situation with a custom implementation of animating markers on a map. What made the animation a lot smoother was setting the animation time to equal the interval we were sending location data through the websocket. That way the marker would be finishing its animation to the previous lat/lon just as the new lat/lon value was provided. This allowed for continuously smooth animation (as long as data was still being provided on the websocket).
