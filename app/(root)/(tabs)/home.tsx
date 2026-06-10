import React from "react";
import Map from "@/components/Map";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  Alert,
  Keyboard,
  Pressable,
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
import { FastForward, RepeatIcon, X } from "lucide-react-native";
import FlatListItemMenu from "@/components/FlatListItemMenu";
import MapViewControls from "@/components/MapViewControls";
import NextStopCard from "@/components/NextStopCard";
// TODO: set camera

export default function Home() {
  const home = useHomeLogic();

  return (
    <Pressable
      className="flex-1"
      onPress={() => {
        Keyboard.dismiss();
        home.setIsInputFocused(false);
      }}
    >
      <View className="flex-1">
        <View className="absolute inset-0">
          <Map ref={home.mapRef} />
          <NavigationDrawer drawerId="main-nav" />

          {/* Top-left: hamburger (planning mode) or X (navigation mode) */}
          <SafeAreaView
            className="absolute left-4 z-10"
            style={{ marginTop: home.androidTopMargin }}
          >
            {home.pathname === "/home" && (
              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg elevation-5 mt-2"
                onPress={
                  home.isNavigating
                    ? home.handleStopNavigation
                    : () => home.setDrawerOpen("main-nav", true)
                }
                activeOpacity={0.7}
              >
                {home.isNavigating ? (
                  <X size={22} color="#141714" strokeWidth={2.5} />
                ) : (
                  <Ionicons name="menu" size={22} color="#333333" />
                )}
              </TouchableOpacity>
            )}
          </SafeAreaView>

          {/* Map view controls: only during navigation, anchored top-right above sheet */}
          {home.isNavigating && (
            <View
              style={{
                position: "absolute",
                right: 12,
                bottom: (
                  home.isNavigating ? home.navSnapPoints[0] : home.snapPoints[1]
                )
                  ? undefined
                  : 200,
                // Position just above the bottom sheet handle
                top: undefined,
              }}
              className="absolute right-3 bottom-[22%]"
              // Place it 20% + some padding above bottom
            >
              <MapViewControls
                viewMode={home.viewMode}
                onToggleView={home.handleToggleView}
                onRecenter={home.handleRecenter}
              />
            </View>
          )}
        </View>

        <Portal>
          <BottomSheet
            ref={home.sheetRef}
            index={1}
            onChange={home.setSnapIndex}
            snapPoints={
              home.isNavigating ? home.navSnapPoints : home.snapPoints
            }
            enablePanDownToClose={false}
            enableContentPanningGesture={!home.isDragging}
            activeOffsetY={[-10, 10]}
            backgroundStyle={{ backgroundColor: "#141714" }}
            handleIndicatorStyle={{ backgroundColor: "#849081" }}
          >
            {home.isNavigating ? (
              /* ── NAVIGATION MODE ── */
              <View style={{ flex: 1 }}>
                {home.currentStop ? (
                  <NextStopCard
                    stop={home.currentStop}
                    stopNumber={home.currentStopIndex + 1}
                    totalStops={home.nonUserStops.length}
                    onMarkDone={home.handleMarkDone}
                    onSkip={home.handleSkip}
                    onPrev={home.goToPrevStop}
                    onNext={home.advanceToNextStop}
                    canGoPrev={home.currentStopIndex > 0}
                    canGoNext={
                      home.currentStopIndex < home.nonUserStops.length - 1
                    }
                    isLastStop={home.isLastStop}
                    onFinishTrip={home.handleFinishTrip}
                  />
                ) : null}
              </View>
            ) : (
              /* ── PLANNING MODE ── */
              <GestureDetector gesture={home.contentGesture}>
                <BottomSheetScrollView style={{ flex: 1 }}>
                  <View className="flex-1 pb-6 space-y-4">
                    {home.hasActiveTrip ? (
                      <View className="flex w-full mx-auto space-x-5">
                        <View
                          className="w-full relative"
                          onLayout={(event) => {
                            const { height } = event.nativeEvent.layout;
                            home.setSearchInputHeight(height);
                          }}
                        >
                          <View className="flex flex-row items-center w-full px-6">
                            <View className="flex flex-1 justify-center px-3">
                              <GoogleTextInput
                                ref={home.googleInputRef}
                                icon={icons.search}
                                containerStyle={"bg-[#1F1F1F] rounded-xl"}
                                handlePress={home.handleAddStop}
                                onTextInputFocus={home.onPressInputField}
                                textInputBackgroundColor="#1F1F1F"
                              />
                            </View>
                            <View className="flex-shrink-0 absolute right-0 top-1/2 -translate-y-1/2 px-3">
                              <FlatListItemMenu
                                menuId="google-text-input"
                                menuType="google-input"
                              />
                            </View>
                          </View>
                        </View>

                        <DraggableList
                          stops={home.activeTrip?.stops || []}
                          onReorder={home.handleManualReorder}
                          snapIndex={home.snapIndex}
                          snapPoints={home.snapPoints}
                          searchInputHeight={home.searchInputHeight}
                          onDragStart={() => home.setIsDragging(true)}
                          onDragEndGlobal={() => home.setIsDragging(false)}
                        />

                        <View className="flex-row items-center gap-4 w-full px-6 mt-4">
                          <Button
                            variant="outline"
                            size="md"
                            action="primary"
                            className="flex-1 border-2 border-brand-500 rounded-md h-12"
                            onPress={() => {
                              if (!home.currentUserLocation) {
                                Alert.alert(
                                  "Location unavailable",
                                  "Enable GPS to optimize your route.",
                                );
                                return;
                              }
                              home.optimizeRoute(home.currentUserLocation);
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

                          <Button
                            variant="outline"
                            size="md"
                            action="primary"
                            className="flex-1 bg-brand-500 rounded-md h-12"
                            onPress={home.handleStartRoute}
                          >
                            <ButtonIcon
                              as={FastForward}
                              size="lg"
                              className="mr-2"
                            />
                            <ButtonText className="text-background-900 font-medium">
                              Start Route
                            </ButtonText>
                          </Button>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-1 justify-center items-center">
                        <NameTripField handlePress={home.onPressInputField} />
                      </View>
                    )}
                  </View>
                </BottomSheetScrollView>
              </GestureDetector>
            )}
          </BottomSheet>
        </Portal>
      </View>
    </Pressable>
  );
}
