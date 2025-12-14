import {ActivityIndicator, FlatList, TouchableOpacity, View} from "react-native";
import TripCard from "@/components/TripCard";
import {Image} from "@/components/ui/image";
import {icons, images} from "@/constants";
import {Text} from "@/components/ui/text";
import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import {SafeAreaView} from "react-native-safe-area-context";
import React from "react";
import {useFetch} from "@/lib/fetch";
import {Trip} from "@/types/type";
import {useAuth, useUser} from "@clerk/clerk-expo";

function Trips(props) {
    const { user } = useUser();
    const {
        data: recentTrips,
        loading,
        error,
    } = useFetch<Trip[]>(`/(api)/trip/${user?.id}`);
    return (
        <SafeAreaView className="bg-general-500">
            <FlatList
                data={trips?.slice(0, 5)}
                renderItem={({ item }) => <TripCard trip={item} />}
                className="px-5"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={() => (
                    <View className="flex flex-col items-center justify-center">
                        {!loading ? (
                            <>
                                <Image
                                    source={images.noResult}
                                    className="w-40 h-40"
                                    alt="no recent routes found"
                                    resizeMode={"contain"}
                                />
                                <Text className="text-sm">No recent trips found</Text>
                            </>
                        ) : (
                            <ActivityIndicator size={"small"} color={"#000"} />
                        )}
                    </View>
                )}
                ListHeaderComponent={() => (
                    <>
                        <View className="flex flex-row items-center justify-center my-5">
                            <Text className={"text-2xl text-weight-bold capitalize"}>
                                Welcome{", "}
                                {user?.firstName ||
                                    user?.emailAddresses[0].emailAddress.split("@")[0]}
                            </Text>
                            <TouchableOpacity
                                onPress={handleSignOut}
                                className={"justify-center items-center w-10 h-10 rounded-full"}
                            >
                                <Image
                                    alt={"icon out"}
                                    source={icons.out}
                                    className={"w-4 h-4"}
                                />
                            </TouchableOpacity>
                        </View>
                        <GoogleTextInput
                            icon={icons.search}
                            containerStyle={"bg-white shadow-md shadow-neutral-300"}
                            handlePress={handleDestinationPress}
                        />
                        <Text className={"text-xl font-bold mt-5 mb-3"}>
                            Your Current Location
                        </Text>
                        <View
                            className={"flex flex-row items-center bg-transparent h-[300px]"}
                        >
                            <Map />
                        </View>
                    </>
                )}
            />
        </SafeAreaView>
    );
}

export default Trips;

