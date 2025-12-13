import React, { useEffect, useState } from "react";
import Map from "@/components/Map";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Keyboard, Pressable, View } from "react-native";
import { Portal } from "@gorhom/portal";
import GoogleTextInput from "@/components/GoogleTextInput";
import { icons } from "@/constants";
import { useHomeLogic } from "@/lib/homelogic";
import NameTripField from "@/components/NameTripField";
import { mockStops } from "@/lib/mockStops";
import { TripMarker } from "@/types/type";
import { useTripStore } from "@/store";
import { FlashList } from "@/components/FlashList";
// TODO: set camera
// getCamera
// animateCamera 	camera: Camera, { duration: Number }
// Animate the camera to a new view. You can pass a partial camera object here;
// any property not given will remain unmodified. duration is not supported on iOS.

export default function Home() {
  const [stops, setStops] = useState<TripMarker[]>([]);
  const { reorderStopsAccordingToOptimization } = useTripStore();

  const mockTrip = {};
  const getStops = async (): Promise<TripMarker[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStops), 300); // simulate network
    });
  };

  useEffect(() => {
    getStops().then(setStops);
  }, []);
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
            handleIndicatorStyle={{ backgroundColor: "#849081" }}
          >
            <BottomSheetView className="flex-1">
              <View className="flex-1 items-center justify-center p-5 space-y-4">
                {hasActiveTrip ? (
                  <>
                    <GoogleTextInput
                      icon={icons.search}
                      containerStyle={
                        "bg-[#2D322C] flex flex-row items-center justify-center relative z-99 rounded-xl"
                      }
                      handlePress={handleDestinationPress}
                      onTextInputFocus={onPressInputField}
                      textInputBackgroundColor="#2D322C"
                    />
                    <View className="flex-1 w-full">
                      {/*<FlashList stops={stops} />*/}
                    </View>
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
