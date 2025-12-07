import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { View } from "react-native";
import { useLocationStore, useTripStore } from "@/store";
import { calculateRegion } from "@/lib/map";
import { useEffect, useRef } from "react";
import LocationCluster from "@/components/LocationCluster";
import StopMarker from "@/components/StopMarker";

const Map = () => {
  const mapRef = useRef<MapView>(null);
  const { currentUserLatitude, currentUserLongitude } = useLocationStore();
  const { activeTrip } = useTripStore();
  const region = calculateRegion({
    markers: activeTrip?.stops || [],
    userLatitude: currentUserLatitude,
    userLongitude: currentUserLongitude,
  });
    const darkMapStyle = [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
        {
            featureType: "administrative",
            elementType: "geometry",
            stylers: [{ color: "#757575" }],
        },
        {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#303030" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#383838" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#000000" }],
        },
    ];

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
        {/* Trip Markers */}
        {activeTrip?.stops?.map((stop) => (
          <Marker
            key={stop.stop_id}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={stop.address}
          >
              <StopMarker width="40" height="40" text={stop.stop_id} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};
export default Map;

// We weren't using react-native-maps, but we ran into a similar situation with a custom implementation of animating markers on a map. What made the animation a lot smoother was setting the animation time to equal the interval we were sending location data through the websocket. That way the marker would be finishing its animation to the previous lat/lon just as the new lat/lon value was provided. This allowed for continuously smooth animation (as long as data was still being provided on the websocket).
