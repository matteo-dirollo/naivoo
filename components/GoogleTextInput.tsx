import { View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { googlePlacesApiKey, icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import { Image } from "@/components/ui/image";
import { forwardRef, useImperativeHandle, useRef } from "react";

const GoogleTextInput = forwardRef(
  (
    {
      icon,
      initialLocation,
      containerStyle,
      textInputBackgroundColor,
      handlePress,
      onTextInputFocus,
    }: GoogleInputProps,
    ref,
  ) => {
    const googlePlacesRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        googlePlacesRef.current?.clear();
        googlePlacesRef.current?.setAddressText("");
      },
    }));
    return (
      <View className={containerStyle} pointerEvents="box-none">
        <GooglePlacesAutocomplete
          fetchDetails={true}
          placeholder="Search"
          debounce={200}
          enablePoweredByContainer={false}
          keyboardShouldPersistTaps="handled"
          styles={{
            container: { flex: 1, zIndex: 1000 },
            textInputContainer: {
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              marginHorizontal: 5,
              position: "relative",
              zIndex: 1000,
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
              color: "white",
            },
            listView: {
              backgroundColor: textInputBackgroundColor
                ? textInputBackgroundColor
                : "white",
              color: "white",
              position: "absolute",
              top: 10,
              left: 0,
              right: 0,
              width: "100%",
              borderRadius: 0,
              zIndex: 1000,
              elevation: 20,
            },
            row: {
              backgroundColor: textInputBackgroundColor,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderBottomWidth: 0.5,
              borderBottomColor: "#464D44",
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
            onFocus: () => {
              setTimeout(() => {
                onTextInputFocus?.();
              }, 10); // workaround for gesture interference
            },
          }}
        />
      </View>
    );
  },
);
GoogleTextInput.displayName = "GoogleTextInput";
export default GoogleTextInput;
