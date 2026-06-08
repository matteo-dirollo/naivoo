import React from "react";
import Map from "@/components/Map";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { Portal } from "@gorhom/portal";
import GoogleTextInput from "@/components/GoogleTextInput";
import { icons } from "@/constants";
import { useHomeLogic } from "@/lib/homelogic";
import NameTripField from "@/components/NameTripField";
import { DraggableList } from "@/components/DraggableList";
import { GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { EllipsisVertical, RepeatIcon } from "lucide-react-native";
import FlatListItemMenu from "@/components/FlatListItemMenu";
// TODO: set camera
// getCamera
// animateCamera 	camera: Camera, { duration: Number }
// Animate the camera to a new view. You can pass a partial camera object here;
// any property not given will remain unmodified. duration is not supported on iOS.

export default function Home() {
  const {
    hasActiveTrip,
    sheetRef,
    setIsInputFocused,
    onPressInputField,
    searchInputHeight,
    setSearchInputHeight,
    contentGesture,
    snapPoints,
    snapIndex,
    setSnapIndex,
    activeTrip,
    googleInputRef,
    handleAddStop,
    handleManualReorder,
    isDragging,
    setIsDragging,
    setDrawerOpen,
    optimizeRoute,
    currentUserLocation,
  } = useHomeLogic();
  const androidTopMargin =
    Platform.OS === "android" ? StatusBar.currentHeight : 0;

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
          <NavigationDrawer />
          <SafeAreaView
            className="absolute left-4 z-10"
            style={{ marginTop: androidTopMargin }}
          >
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg elevation-5 mt-2"
              onPress={() => setDrawerOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color="#333333" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <Portal>
          <BottomSheet
            ref={sheetRef}
            index={1}
            onChange={setSnapIndex}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            enableContentPanningGesture={!isDragging}
            activeOffsetY={[-10, 10]}
            backgroundStyle={{ backgroundColor: "#141714" }}
            handleIndicatorStyle={{ backgroundColor: "#849081" }}
          >
            <GestureDetector gesture={contentGesture}>
              <BottomSheetScrollView style={{ flex: 1 }}>
                <View className="flex-1 px-4 pb-6 space-y-4">
                  {hasActiveTrip ? (
                    <View className="flex w-full mx-auto space-x-5">
                      <View
                        className="w-full relative"
                        onLayout={(event) => {
                          const { height } = event.nativeEvent.layout;
                          setSearchInputHeight(height);
                        }}
                      >
                        <View className="flex flex-row items-center w-full">
                          <View className="flex flex-1 justify-center z-0">
                            <GoogleTextInput
                              ref={googleInputRef}
                              icon={icons.search}
                              containerStyle={"bg-[#2D322C] rounded-xl"}
                              handlePress={handleAddStop}
                              onTextInputFocus={onPressInputField}
                              textInputBackgroundColor="#2D322C"
                            />
                          </View>
                          <View className="flex-shrink-0 absolute right-2 top-1/2 -translate-y-1/2 z-50">
                            <FlatListItemMenu menuId="google-text-input" />
                          </View>
                        </View>
                      </View>

                      <DraggableList
                        stops={activeTrip?.stops || []}
                        onReorder={handleManualReorder}
                        snapIndex={snapIndex}
                        snapPoints={snapPoints}
                        searchInputHeight={searchInputHeight}
                        onDragStart={() => setIsDragging(true)}
                        onDragEndGlobal={() => setIsDragging(false)}
                      />
                      <Button
                        variant="outline"
                        size="md"
                        action="primary"
                        className="w-[80%] mx-auto mt-0.5 border-2 border-brand-500 rounded-md h-12 "
                        onPress={() => {
                          if (!currentUserLocation) {
                            Alert.alert(
                              "Location unavailable",
                              "Enable GPS to optimize your route.",
                            );
                            return;
                          }
                          optimizeRoute(currentUserLocation);
                        }}
                      >
                        <ButtonIcon
                          as={RepeatIcon}
                          size="lg"
                          className="mr-2 text-brand-500"
                        />
                        <ButtonText className="text-brand-500 font-medium">
                          Reorganize Stops
                        </ButtonText>
                      </Button>
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
