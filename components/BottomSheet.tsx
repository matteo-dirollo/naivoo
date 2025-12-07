import React, { useCallback, useRef, useMemo } from "react";
import { StyleSheet, View, Text, Button } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const SheetContent = () => {
    // hooks
    const sheetRef = useRef<BottomSheet>(null);

    // variables
    const data = useMemo(
        () =>
            Array(50)
                .fill(0)
                .map((_, index) => `index-${index}`),
        []
    );
    const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

    // callbacks
    const handleSheetChange = useCallback((index) => {
        console.log("handleSheetChange", index);
    }, []);
    const handleSnapPress = useCallback((index) => {
        sheetRef.current?.snapToIndex(index);
    }, []);
    const handleClosePress = useCallback(() => {
        sheetRef.current?.close();
    }, []);

    // render
    const renderItem = useCallback(
        (item) => (
            <View key={item} className="p-[6px] m-[6px] bg-[#eee]">
                <Text>{item}</Text>
            </View>
        ),
        []
    );

    return (
        <GestureHandlerRootView className="flex-1 pt-[200px]">
            <Button title="Snap To 90%" onPress={() => handleSnapPress(2)} />
            <Button title="Snap To 50%" onPress={() => handleSnapPress(1)} />
            <Button title="Snap To 25%" onPress={() => handleSnapPress(0)} />
            <Button title="Close" onPress={() => handleClosePress()} />
            <BottomSheet
                ref={sheetRef}
                index={1}
                snapPoints={snapPoints}
                enableDynamicSizing={false}
                onChange={handleSheetChange}
            >
                <BottomSheetScrollView contentContainerStyle={{ backgroundColor: "white" }}>
                    {data.map(renderItem)}
                </BottomSheetScrollView>
            </BottomSheet>
        </GestureHandlerRootView>
    )
}

export default SheetContent;