import { View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import { Image } from "@/components/ui/image";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {

  return (
    <View
      className={`flex flex-row items-center justify-center relative z-99 rounded-xl ${containerStyle}`} pointerEvents="box-none"
    >
      <GooglePlacesAutocomplete
          // onPlaceSelected={""}
          // onSearchError={""}
        fetchDetails={true}
        placeholder="Search"
        debounce={200}
        styles={{
          textInputContainer: {
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            marginHorizontal: 5,
            position: "relative",
            shadowColor: "#d4d4d4",
          },
          textInput: {
            backgroundColor: textInputBackgroundColor
              ? textInputBackgroundColor
              : "white",
            fontSize: 16,
            fontWeight: "400",
            marginTop: 5,
            marginHorizontal: 4,
            width: "100%",
            borderRadius: 20,
              color: "white"
          },
          listView: {
            backgroundColor: textInputBackgroundColor
              ? textInputBackgroundColor
              : "white",
              color: "white",
            position: "relative",
            top: 0,
            width: "100%",
            borderRadius: 10,
            shadowColor: "#d4d4d4",
            zIndex: 99,
              elevation: 99
          },
            row: {
                backgroundColor: textInputBackgroundColor,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#333", // subtle divider
            },
            description: {
                color: "white",
            },
            poweredContainer: {
                backgroundColor: "#1f201e",
            },
            powered: {
                tintColor: "gray",
            },
        }}
        onPress={(data, details = null) => {
          handlePress({
            latitude: details?.geometry.location.lat!,
            longitude: details?.geometry.location.lng!,
            address: data.description,
          });
        }}
        query={{
          key: googlePlacesApiKey,
          language: "en",
        }}
        renderLeftButton={() => (
          <View className="justify-center items-center w-6 h-6 mr-2">
            <Image
              source={icon ? icon : icons.search}
              className="w-6 h-6 ml-5"
              resizeMode="contain"
            />
          </View>
        )}
        textInputProps={{
          placeholderTextColor: "gray",
          placeholder: initialLocation ?? "Where do you want to go?",
        }}
      />
    </View>
  );
};

export default GoogleTextInput;
