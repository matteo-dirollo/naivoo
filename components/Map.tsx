import { Text } from "@/components/ui/text";
import MapView, { PROVIDER_DEFAULT } from "react-native-maps";

const Map = () => {
  const region = {
    latitude: 45.464211,
    longitude: 9.191383,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      className="w-full h-full rounded-2xl"
      tintColor="Black"
      mapType="mutedStandard"
      showsPointsOfInterests={false}
      initialRegion={region}
    >
      <Text>Map</Text>
    </MapView>
  );
};
export default Map;
