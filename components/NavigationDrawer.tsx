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
import { Button } from "@/components/ui/button"; // Path to your store

export function NavigationDrawer() {
  const isDrawerOpen = useDrawerStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useDrawerStore((state) => state.setDrawerOpen);

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setDrawerOpen(false)}
      anchor="left"
      size="md"
    >
      <DrawerBackdrop />
      <DrawerContent className="bg-white p-4">
        <DrawerHeader className="border-b border-gray-100 pb-3">
          <Heading size="md">Naivoo</Heading>
        </DrawerHeader>

        <DrawerBody className="py-4">
          <Text className="text-sm text-gray-500">
            Your menu content and navigation items go here.
          </Text>
        </DrawerBody>

        <DrawerFooter>
          <Button
            variant="outline"
            action="secondary"
            onPress={() => setDrawerOpen(false)}
            className="w-full"
          >
            <Text>Close</Text>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
