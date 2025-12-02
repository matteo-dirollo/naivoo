import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Platform, View } from "react-native";
import { useLocationStore } from "@/store";
import { calculateRegion } from "@/lib/map";

const Map = () => {
  const { currentUserLatitude, currentUserLongitude } = useLocationStore();
  const region = calculateRegion({
    latitude: currentUserLatitude!,
    longitude: currentUserLongitude!,
  });

  return (
    <View className="w-full h-full rounded-2xl">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        tintColor="Black"
        mapType="standard"
        showsPointsOfInterest={false}
        initialRegion={region}
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
