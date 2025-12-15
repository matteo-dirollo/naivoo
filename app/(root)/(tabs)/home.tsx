import React, { useEffect, useState } from "react";
import Map from "@/components/Map";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Keyboard, Pressable, View } from "react-native";
import { Portal } from "@gorhom/portal";
import GoogleTextInput from "@/components/GoogleTextInput";
import { icons } from "@/constants";
import { useHomeLogic } from "@/lib/homelogic";
import NameTripField from "@/components/NameTripField";
import { mockStops } from "@/lib/mockStops";
import { TripMarker } from "@/types/type";
import { useTripStore } from "@/store";
import { DraggableList } from "@/components/DraggableList";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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

  const contentGesture = Gesture.Native().simultaneousWithExternalGesture(
    Gesture.Pan().runOnJS(true),
  );

  useEffect(() => {
    getStops().then(setStops);
  }, []);
  const {
    fetchActiveTrip,
    hasActiveTrip,
    sheetRef,
    setIsInputFocused,
    onPressInputField,
    searchInputHeight,
    setSearchInputHeight,
    snapPoints,
    snapIndex,
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
        <View className="absolute inset-0">
          <Map />
        </View>

        <Portal>
          <BottomSheet
            ref={sheetRef}
            index={1}
            onChange={setSnapIndex}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            enableContentPanningGesture={false}
            activeOffsetY={[-10, 10]}
            backgroundStyle={{ backgroundColor: "#141714" }}
            handleIndicatorStyle={{ backgroundColor: "#849081" }}
          >
            <GestureDetector gesture={contentGesture}>
              <BottomSheetScrollView style={{ flex: 1 }}>
                <View className="flex-1 p-5 space-y-4">
                  {hasActiveTrip ? (
                    <View className="flex-1 w-full mx-auto space-x-5">
                      <View
                        className="w-full"
                        onLayout={(event) => {
                          const { height } = event.nativeEvent.layout;
                          setSearchInputHeight(height);
                          console.log("GoogleTextInput actual height:", height);
                        }}
                      >
                        <GoogleTextInput
                          icon={icons.search}
                          containerStyle={
                            "bg-[#2D322C] flex flex-row items-center justify-center relative rounded-xl"
                          }
                          handlePress={handleDestinationPress}
                          onTextInputFocus={onPressInputField}
                          textInputBackgroundColor="#2D322C"
                        />
                      </View>

                      <DraggableList
                        stops={stops}
                        onReorder={reorderStopsAccordingToOptimization}
                        snapIndex={snapIndex}
                        snapPoints={snapPoints}
                        searchInputHeight={searchInputHeight}
                      />
                    </View>
                  ) : (
                    <View className="flex-1 justify-center items-center">
                      <NameTripField handlePress={onPressInputField} />
                    </View>
                  )}
                </View>
              </BottomSheetScrollView>
            </GestureDetector>
          </BottomSheet>
        </Portal>
      </View>
    </Pressable>
  );
}
