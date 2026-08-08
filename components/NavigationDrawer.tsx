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
import { useDrawerStore, useTripStore, useUserLocationStore } from "@/store";
import TripsHistory from "@/components/TripsHistory";
import { useClerk, useUser } from "@clerk/clerk-expo";

import {
  Avatar,
  AvatarBadge,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { LogOut } from "lucide-react-native";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSubscriptionStore } from "@/store/subscriptionStore";

interface NavigationDrawerProps {
  drawerId: string;
}

function formatShortDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function usePlanLabel() {
  const { status, trialEndsAt, currentPeriodEnd, cancelAtPeriodEnd } =
    useSubscriptionStore();

  switch (status) {
    case "trialing": {
      const end = formatShortDate(trialEndsAt);
      return end ? `Free trial · ends ${end}` : "Free trial";
    }
    case "active": {
      if (cancelAtPeriodEnd) {
        const end = formatShortDate(currentPeriodEnd);
        return end ? `Naivoo Pro · ends ${end}` : "Naivoo Pro · ending soon";
      }
      const renew = formatShortDate(currentPeriodEnd);
      return renew ? `Naivoo Pro · renews ${renew}` : "Naivoo Pro";
    }
    case "past_due":
      return "Payment failed — update your card";
    case "canceled":
      return "Plan expired";
    default:
      return "Free plan";
  }
}

export function NavigationDrawer({ drawerId }: NavigationDrawerProps) {
  const isDrawerOpen = useDrawerStore((state) => state.isDrawerOpen(drawerId));
  const setDrawerOpen = useDrawerStore((state) => state.setDrawerOpen);
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const planLabel = usePlanLabel();

  const { signOut } = useClerk();
  const router = useRouter();

  const clearAllTrips = useTripStore((state) => state.clearAllTrips);
  const clearSubscription = useSubscriptionStore(
    (state) => state.clearSubscription,
  );
  const setCurrentUserLocation = useUserLocationStore(
    (state) => state.setCurrentUserLocation,
  );

  const handleSignOut = async () => {
    try {
      clearAllTrips();
      clearSubscription();
      setCurrentUserLocation(null);
      await signOut();
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleOpenProfile = () => {
    setDrawerOpen(drawerId, false);
    router.push("/(root)/profile");
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={() => setDrawerOpen(drawerId, false)}
      anchor="left"
      size="lg"
    >
      <DrawerBackdrop />
      <DrawerContent className="bg-background-950 border-background-900 p-6">
        <DrawerHeader className="border-b border-background-800 pb-3 mt-8">
          <HStack>
            <Pressable
              onPress={handleOpenProfile}
              className="active:opacity-60"
            >
              <VStack className={"items-start"}>
                <Avatar size="md">
                  <AvatarFallbackText>{user?.firstName}</AvatarFallbackText>
                  <AvatarImage source={{ uri: `${user?.imageUrl}` }} />
                  <AvatarBadge />
                </Avatar>

                <Heading className="text-xl font-bold text-white mt-2 text-left">
                  {email}
                </Heading>
                <Text className="text-sm text-primary-100">{planLabel}</Text>
              </VStack>
            </Pressable>

            <Pressable onPress={handleSignOut} className="active:opacity-60">
              <LogOut
                color="#fff"
                strokeWidth={1}
                className="text-background-300 w-6 h-6 mt-4"
              />
            </Pressable>
          </HStack>
        </DrawerHeader>

        <DrawerBody className="py-4">
          <TripsHistory userId={user?.id || ""} />
        </DrawerBody>

        <DrawerFooter></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
