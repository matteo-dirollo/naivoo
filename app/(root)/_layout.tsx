import { Stack, Redirect } from "expo-router";
import { useEffect } from "react";
import { useTripStore } from "@/store";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useUser } from "@clerk/clerk-expo";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const SKIP_PAYWALL = process.env.EXPO_PUBLIC_SKIP_PAYWALL === "true";

export default function AppLayout() {
  const { user, isLoaded } = useUser();
  const { fetchActiveTrip } = useTripStore();
  const { status, isLoading, fetchSubscriptionStatus } = useSubscriptionStore();

  useEffect(() => {
    const load = async () => {
      if (!isLoaded || !user?.id) return;
      await Promise.all([
        fetchActiveTrip(user.id),
        fetchSubscriptionStatus(user.id),
      ]);
    };
    load();
  }, [user?.id, isLoaded, fetchActiveTrip, fetchSubscriptionStatus]);

  if (!isLoaded || (user?.id && status === "unknown")) {
    return null;
  }

  // Only block users who have NEVER subscribed. Anyone who's trialed,
  // paid, then lapsed (past_due/canceled) keeps app access — they just
  // lose route optimization, handled per-screen via hasFullAccess.
  const neverSubscribed = status === "none";

  if (user?.id && neverSubscribed && !isLoading && !SKIP_PAYWALL) {
    return <Redirect href="/(subscription)/paywall" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="profile"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
}
