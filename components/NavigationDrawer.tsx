// components/NavigationDrawer.tsx
import React from "react";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useDrawerStore } from "@/store";
import { Text } from "react-native";
import { Heading } from "@/components/ui/heading";
import TripsHistory from "@/components/TripsHistory"; // Path to your store

export function NavigationDrawer() {
  const isDrawerOpen = useDrawerStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useDrawerStore((state) => state.setDrawerOpen);

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setDrawerOpen(false)}
      anchor="left"
      size="lg"
    >
      <DrawerBackdrop />
      <DrawerContent className="bg-gray-950 p-4 border-gray-900">
        <DrawerHeader className="border-b border-y-teal-500 pb-3 mt-8">
          <Heading size="md" className="text-white">
            Naivoo
          </Heading>
        </DrawerHeader>

        <DrawerBody className="py-4">
          <Text className="text-sm text-gray-100">
            Your menu content and navigation items go here.
          </Text>
          <TripsHistory />
        </DrawerBody>

        <DrawerFooter></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
