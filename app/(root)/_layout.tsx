import { Stack } from "expo-router";
import { useEffect } from "react";
import { useTripStore } from "@/store";
import { useUser } from "@clerk/clerk-expo";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

export default function AppLayout() {
  const { user, isLoaded } = useUser();
  const { fetchActiveTrip } = useTripStore();
  useEffect(() => {
    const loadTrip = async () => {
      if (!isLoaded || !user?.id) return;
      await fetchActiveTrip(user.id);
    };

    loadTrip();
  }, [user?.id, isLoaded, fetchActiveTrip]);
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
