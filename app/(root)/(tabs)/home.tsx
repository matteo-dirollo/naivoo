import React from "react";
import Map from "@/components/Map";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Keyboard, Pressable, View } from "react-native";
import { Portal } from "@gorhom/portal";
import GoogleTextInput from "@/components/GoogleTextInput";
import { icons } from "@/constants";
import { useHomeLogic } from "@/lib/homelogic";
import NameTripField from "@/components/NameTripField";
// TODO: set camera
// getCamera
// animateCamera 	camera: Camera, { duration: Number }
// Animate the camera to a new view. You can pass a partial camera object here;
// any property not given will remain unmodified. duration is not supported on iOS.

export default function Home() {
  const {
    fetchActiveTrip,
    hasActiveTrip,
    sheetRef,
    setIsInputFocused,
    onPressInputField,
    snapPoints,
    setSnapIndex,
    handleDestinationPress,
  } = useHomeLogic();

  return (
    <Pressable
      className="flex-1"
      onPress={() => {
        Keyboard.dismiss();
        setIsInputFocused(false);
      }}
    >
      <View className="flex-1">
        <View className="absolute inset-0" pointerEvents="none">
          <Map />
        </View>

        <Portal>
          <BottomSheet
            ref={sheetRef}
            index={1}
            onChange={setSnapIndex}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            backgroundStyle={{ backgroundColor: "#141714" }}
          >
            <BottomSheetView className="flex-1">
              <View className="flex-1 items-center justify-center p-5 space-y-4">
                {hasActiveTrip ? (
                  <>
                    <GoogleTextInput
                      icon={icons.search}
                      containerStyle={
                        "bg-[#1f201e] shadow-md shadow-neutral-300"
                      }
                      handlePress={handleDestinationPress}
                      onTextInputFocus={onPressInputField}
                      textInputBackgroundColor="#1f201e"
                    />
                  </>
                ) : (
                  <>
                    <NameTripField handlePress={onPressInputField} />
                  </>
                )}
              </View>
            </BottomSheetView>
          </BottomSheet>
        </Portal>
      </View>
    </Pressable>
  );
}
