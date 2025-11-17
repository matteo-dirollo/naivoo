import {useUser, useAuth} from "@clerk/clerk-expo";

import * as Location from "expo-location";
import {router} from "expo-router";
import {useState, useEffect} from "react";
import {
    Text,

} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";


const Home = () => {
    // const { user } = useUser();
    // const { signOut } = useAuth();
    //
    // const { setUserLocation, setDestinationLocation } = useLocationStore();


    return (
        <SafeAreaView className="bg-general-500">
            <Text>Hello World!</Text>
        </SafeAreaView>
    );
};

export default Home;
