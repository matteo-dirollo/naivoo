import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={18} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#333",
          borderRadius: 50,
          paddingBottom: 0, // ios only
          overflow: "hidden",
          marginHorizontal: 20,
          marginBottom: 20,
          height: 78,
          display: "none",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="star-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="star-o" color={color} />,
        }}
      />

        <Tabs.Screen
            name="profile"
            options={{
                title: "Profile",
                headerShown: false,
                tabBarIcon: ({ color }) => <TabBarIcon name="star-o" color={color} />,
            }}
        />
    </Tabs>
  );
}
