import React, { useRef } from "react";
import Map, { MapHandle } from "@/components/Map";
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
import { useNavigationStore } from "@/store/navigationStore";
import MapViewControls from "@/components/MapViewControls";
import NextStopCard from "@/components/NextStopCard";
// TODO: set camera

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
    androidTopMargin,
    pathname,
  } = useHomeLogic();

  const {
    isNavigating,
    currentStopIndex,
    viewMode,
    startNavigation,
    stopNavigation,
    setViewMode,
    markCurrentStopDone,
    skipCurrentStop,
    advanceToNextStop,
    goToPrevStop,
  } = useNavigationStore();

  const mapRef = useRef<MapHandle>(null);

  // Derive the ordered (non-user) stops for navigation
  const nonUserStops = (activeTrip?.stops ?? []).filter(
    (s) => !s.isUserLocation,
  );

  const currentStop = nonUserStops[currentStopIndex] ?? null;
  const isLastStop = currentStopIndex === nonUserStops.length - 1;

  const handleStartRoute = () => {
    if (!currentUserLocation) {
      Alert.alert("Location unavailable", "Enable GPS to start navigation.");
      return;
    }
    if (nonUserStops.length === 0) {
      Alert.alert("No stops", "Add at least one stop before starting.");
      return;
    }
    startNavigation();
    // Snap sheet to small so map is more visible
    sheetRef.current?.snapToIndex(0);
  };

  const handleStopNavigation = () => {
    stopNavigation();
    sheetRef.current?.snapToIndex(1);
  };

  const handleToggleView = () => {
    setViewMode(viewMode === "navigation" ? "overview" : "navigation");
  };

  const handleRecenter = () => {
    mapRef.current?.recenter();
  };

  const handleMarkDone = () => {
    if (!activeTrip) return;
    markCurrentStopDone(activeTrip.stops);
  };

  const handleSkip = () => {
    if (!activeTrip) return;
    skipCurrentStop(activeTrip.stops);
  };

  const handleFinishTrip = () => {
    Alert.alert("Trip Complete!", "You've reached all your stops.", [
      {
        text: "OK",
        onPress: handleStopNavigation,
      },
    ]);
  };

  // Navigation snap points: smaller sheet during navigation
  const navSnapPoints = ["20%", "40%"];
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
          <Map ref={mapRef} />
          <NavigationDrawer drawerId="main-nav" />

          {/* Top-left: hamburger (planning mode) or X (navigation mode) */}
          <SafeAreaView
            className="absolute left-4 z-10"
            style={{ marginTop: androidTopMargin }}
          >
            {pathname === "/home" && (
              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg elevation-5 mt-2"
                onPress={
                  isNavigating
                    ? handleStopNavigation
                    : () => setDrawerOpen("main-nav", true)
                }
                activeOpacity={0.7}
              >
                {isNavigating ? (
                  <X size={22} color="#141714" strokeWidth={2.5} />
                ) : (
                  <Ionicons name="menu" size={24} color="#333333" />
                )}
              </TouchableOpacity>
            )}
          </SafeAreaView>

          {/* Map view controls: only during navigation, anchored top-right above sheet */}
          {isNavigating && (
            <View
              style={{
                position: "absolute",
                right: 12,
                bottom: (isNavigating ? navSnapPoints[0] : snapPoints[1])
                  ? undefined
                  : 200,
                // Position just above the bottom sheet handle
                top: undefined,
              }}
              className="absolute right-3 bottom-[22%]"
              // Place it 20% + some padding above bottom
            >
              <MapViewControls
                viewMode={viewMode}
                onToggleView={handleToggleView}
                onRecenter={handleRecenter}
              />
            </View>
          )}
        </View>

        <Portal>
          <BottomSheet
            ref={sheetRef}
            index={1}
            onChange={setSnapIndex}
            snapPoints={isNavigating ? navSnapPoints : snapPoints}
            enablePanDownToClose={false}
            enableContentPanningGesture={!isDragging}
            activeOffsetY={[-10, 10]}
            backgroundStyle={{ backgroundColor: "#141714" }}
            handleIndicatorStyle={{ backgroundColor: "#849081" }}
          >
            {isNavigating ? (
              /* ── NAVIGATION MODE ── */
              <View style={{ flex: 1 }}>
                {currentStop ? (
                  <NextStopCard
                    stop={currentStop}
                    stopNumber={currentStopIndex + 1}
                    totalStops={nonUserStops.length}
                    onMarkDone={handleMarkDone}
                    onSkip={handleSkip}
                    onPrev={goToPrevStop}
                    onNext={advanceToNextStop}
                    canGoPrev={currentStopIndex > 0}
                    canGoNext={currentStopIndex < nonUserStops.length - 1}
                    isLastStop={isLastStop}
                    onFinishTrip={handleFinishTrip}
                  />
                ) : null}
              </View>
            ) : (
              /* ── PLANNING MODE ── */
              <GestureDetector gesture={contentGesture}>
                <BottomSheetScrollView style={{ flex: 1 }}>
                  <View className="flex-1 pb-6 space-y-4">
                    {hasActiveTrip ? (
                      <View className="flex w-full mx-auto space-x-5">
                        <View
                          className="w-full relative"
                          onLayout={(event) => {
                            const { height } = event.nativeEvent.layout;
                            setSearchInputHeight(height);
                          }}
                        >
                          <View className="flex flex-row items-center w-full px-6">
                            <View className="flex flex-1 justify-center px-3">
                              <GoogleTextInput
                                ref={googleInputRef}
                                icon={icons.search}
                                containerStyle={"bg-[#1F1F1F] rounded-xl"}
                                handlePress={handleAddStop}
                                onTextInputFocus={onPressInputField}
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
                          stops={activeTrip?.stops || []}
                          onReorder={handleManualReorder}
                          snapIndex={snapIndex}
                          snapPoints={snapPoints}
                          searchInputHeight={searchInputHeight}
                          onDragStart={() => setIsDragging(true)}
                          onDragEndGlobal={() => setIsDragging(false)}
                        />

                        <View className="flex-row items-center gap-4 w-full px-6 mt-4">
                          <Button
                            variant="outline"
                            size="md"
                            action="primary"
                            className="flex-1 border-2 border-brand-500 rounded-md h-12"
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

                          <Button
                            variant="outline"
                            size="md"
                            action="primary"
                            className="flex-1 bg-brand-500 rounded-md h-12"
                            onPress={handleStartRoute}
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
                        <NameTripField handlePress={onPressInputField} />
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
