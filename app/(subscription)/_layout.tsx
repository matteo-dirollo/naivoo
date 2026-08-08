import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useSubscriptionStore } from "@/store/subscriptionStore";

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export default function SubscriptionLayout() {
  const { isSignedIn } = useAuth();
  const status = useSubscriptionStore((state) => state.status);
  const hasAccess = useSubscriptionStore((state) => state.hasAccess);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (status !== "unknown" && hasAccess) {
    return <Redirect href="/(root)/(tabs)/home" />;
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="paywall" />
        <Stack.Screen name="checkout" />
      </Stack>
    </StripeProvider>
  );
}
