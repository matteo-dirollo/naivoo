import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Platform, View } from "react-native";

const Map = () => {
  const region = {
    latitude: 45.464211,
    longitude: 9.191383,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

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
            latitude: region.latitude,
            longitude: region.longitude,
          }}
        />
      </MapView>
    </View>
  );
};
export default Map;
