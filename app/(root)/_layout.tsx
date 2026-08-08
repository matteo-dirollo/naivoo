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
  const { status, hasAccess, isLoading, fetchSubscriptionStatus } =
    useSubscriptionStore();

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

  if (user?.id && !hasAccess && !isLoading && !SKIP_PAYWALL) {
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
