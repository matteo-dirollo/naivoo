import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Camera,
} from "react-native-maps";
import { View } from "react-native";
import { useUserLocationStore, useTripStore } from "@/store";
import { useNavigationStore } from "@/store/navigationStore";
import { calculateRegion } from "@/lib/map";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import LocationCluster from "@/components/LocationCluster";
import StopMarker from "@/components/StopMarker";
import { darkMapStyle } from "@/constants";

export interface MapHandle {
  recenter: () => void;
}

const Map = forwardRef<MapHandle>((_, ref) => {
  const mapRef = useRef<MapView>(null);
  const { currentUserLocation } = useUserLocationStore();
  const userLatitude = currentUserLocation?.latitude;
  const userLongitude = currentUserLocation?.longitude;
  const { activeTrip, routeCoords } = useTripStore();
  const { isNavigating, viewMode, currentStopIndex } = useNavigationStore();

  const region = calculateRegion({
    markers: activeTrip?.stops || [],
    userLatitude,
    userLongitude,
  });

  // Expose recenter to parent
  useImperativeHandle(ref, () => ({
    recenter: () => {
      applyCamera();
    },
  }));

  const applyCamera = () => {
    if (!mapRef.current) return;

    if (
      isNavigating &&
      viewMode === "navigation" &&
      userLatitude &&
      userLongitude
    ) {
      const nonUserStops = (activeTrip?.stops || []).filter(
        (s) => !s.isUserLocation,
      );
      const nextStop = nonUserStops[currentStopIndex];

      // Compute bearing toward next stop if available
      let heading = 0;
      if (nextStop) {
        const dLng = nextStop.location.longitude - userLongitude;
        const dLat = nextStop.location.latitude - userLatitude;
        heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
      }

      const camera: Camera = {
        center: { latitude: userLatitude, longitude: userLongitude },
        pitch: 60,
        heading,
        zoom: 17,
        altitude: 400,
      };
      mapRef.current.animateCamera(camera, { duration: 800 });
    } else {
      // Overview: fit all markers
      if (region) {
        mapRef.current.animateToRegion(region, 800);
      }
    }
  };

  // Re-apply camera when navigation state, viewMode, or current stop changes
  useEffect(() => {
    applyCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating, viewMode, currentStopIndex, userLatitude, userLongitude]);

  // Also fit region on overview when stops change
  useEffect(() => {
    if (!isNavigating || viewMode === "overview") {
      if (mapRef.current && region) {
        mapRef.current.animateToRegion(region, 800);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const nonUserStops = (activeTrip?.stops || []).filter(
    (s) => !s.isUserLocation,
  );

  return (
    <View className="w-full h-full rounded-2xl">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        tintColor="Black"
        customMapStyle={darkMapStyle}
        mapType="standard"
        showsPointsOfInterest={false}
        showsUserLocation={false}
        region={region}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {userLatitude != null && userLongitude != null && (
          <Marker
            coordinate={{ latitude: userLatitude, longitude: userLongitude }}
            zIndex={999}
          >
            <LocationCluster size="20" fill="#0075b2" />
          </Marker>
        )}

        {nonUserStops.map((stop, index) => {
          const isDone = stop.isDone;
          const isSkipped = stop.isSkipped;
          const isCurrent = isNavigating && index === currentStopIndex;

          return (
            <Marker
              key={stop.stop_id}
              coordinate={{
                latitude: stop.location.latitude,
                longitude: stop.location.longitude,
              }}
              title={stop.location.address}
              opacity={isDone || isSkipped ? 0.4 : 1}
            >
              <StopMarker
                width="40"
                height="40"
                text={index + 1}
                highlight={isCurrent}
                done={isDone}
                skipped={isSkipped}
              />
            </Marker>
          );
        })}

        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#1ed7b5"
            strokeWidth={3}
          />
        )}
      </MapView>
    </View>
  );
});

Map.displayName = "Map";
export default Map;
