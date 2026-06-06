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
import TripsHistory from "@/components/TripsHistory";
import { useUser } from "@clerk/clerk-expo";

import {
  Avatar,
  AvatarBadge,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";

export function NavigationDrawer() {
  const isDrawerOpen = useDrawerStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useDrawerStore((state) => state.setDrawerOpen);
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setDrawerOpen(false)}
      anchor="left"
      size="lg"
    >
      <DrawerBackdrop />
      <DrawerContent className="bg-background-950 border-background-900 p-6">
        <DrawerHeader className="border-b border-background-800 pb-3 mt-8">
          <VStack className={"items-start"}>
            <Avatar size="md">
              <AvatarFallbackText>{user?.firstName}</AvatarFallbackText>
              <AvatarImage source={{ uri: `${user?.imageUrl}` }} />
              <AvatarBadge />
            </Avatar>

            <Heading className="text-xl font-bold text-white mt-2 text-left">
              {email}
            </Heading>
            <Text className="text-sm text-primary-100">
              Subscription Plan: Free/Paid
            </Text>
          </VStack>
        </DrawerHeader>

        <DrawerBody className="py-4">
          <TripsHistory userId={user?.id || ""} />
        </DrawerBody>

        <DrawerFooter></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
