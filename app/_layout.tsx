import {Stack} from 'expo-router';
import 'react-native-reanimated';
import {ClerkProvider} from "@clerk/clerk-expo";

import './../global.css'
import {tokenCache} from "@clerk/clerk-expo/token-cache";

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    return (
        <ClerkProvider tokenCache={tokenCache}>
            <Stack>
                <Stack.Screen name="index" options={{headerShown: false}}/>
                <Stack.Screen name="(auth)" options={{headerShown: false}}/>
                <Stack.Screen name="(root)" options={{headerShown: false}}/>
                <Stack.Screen name="+not-found"/>
            </Stack>
        </ClerkProvider>

    );
}
