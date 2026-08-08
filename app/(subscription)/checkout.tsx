import { useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useStripe } from "@stripe/stripe-react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText } from "@/components/ui/button";
import { fetchAPI } from "@/lib/fetch";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { TRIAL_DAYS } from "@/constants";

export default function Checkout() {
  const { user } = useUser();
  const { initPaymentSheet, presentPaymentSheet, retrieveSetupIntent } =
    useStripe();
  const fetchSubscriptionStatus = useSubscriptionStore(
    (state) => state.fetchSubscriptionStatus,
  );

  const [isPreparing, setIsPreparing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<{
    customerId: string;
    setupIntentClientSecret: string;
  } | null>(null);

  const prepareSheet = useCallback(async () => {
    if (!user?.id) return;
    setIsPreparing(true);
    setPrepareError(null);

    let step = "customer";
    try {
      const customerResult = await fetchAPI("/(api)/stripe/customer", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          name: user.fullName ?? user.firstName ?? "Naivoo user",
          email: user.primaryEmailAddress?.emailAddress,
        }),
      });
      if (customerResult?.error) throw new Error(customerResult.error);
      const { customerId } = customerResult;

      step = "setup-intent";
      const setupResult = await fetchAPI("/(api)/stripe/setup-intent", {
        method: "POST",
        body: JSON.stringify({ customerId }),
      });
      if (setupResult?.error) throw new Error(setupResult.error);
      const { setupIntent, ephemeralKey } = setupResult;

      step = "init-payment-sheet";
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Naivoo",
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
        allowsDelayedPaymentMethods: false,
      });
      if (error) throw new Error(error.message);

      setPendingIntent({ customerId, setupIntentClientSecret: setupIntent });
      setSheetReady(true);
    } catch (error) {
      // Logs exactly which step failed instead of a generic message.
      console.error(`Checkout prepare failed at step "${step}":`, error);
      setPrepareError(
        `Couldn't prepare checkout (${step}). ${(error as Error).message}`,
      );
    } finally {
      setIsPreparing(false);
    }
  }, [user?.id, initPaymentSheet]);

  useEffect(() => {
    prepareSheet();
  }, [prepareSheet]);

  const handleStartTrial = async () => {
    if (!pendingIntent || !user?.id) return;
    setIsProcessing(true);

    try {
      const { error: sheetError } = await presentPaymentSheet();

      if (sheetError) {
        if (sheetError.code !== "Canceled") {
          Alert.alert("Payment method not saved", sheetError.message);
        }
        return;
      }

      const { setupIntent, error: retrieveError } = await retrieveSetupIntent(
        pendingIntent.setupIntentClientSecret,
      );
      if (retrieveError || !setupIntent?.paymentMethodId) {
        throw new Error(retrieveError?.message ?? "Missing payment method");
      }

      const subscribeResult = await fetchAPI("/(api)/stripe/subscribe", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          customerId: pendingIntent.customerId,
          paymentMethodId: setupIntent.paymentMethodId,
        }),
      });
      if (subscribeResult?.error) throw new Error(subscribeResult.error);

      await fetchSubscriptionStatus(user.id);
      router.replace("/(root)/(tabs)/home");
    } catch (error) {
      console.error("Failed to start trial:", error);
      Alert.alert(
        "Couldn't start your trial",
        "Something went wrong saving your card. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#141714] px-6 justify-center">
      <VStack className="gap-6 items-center">
        <Heading className="text-white text-2xl text-center">
          Add a card to start your trial
        </Heading>
        <Text className="text-background-300 text-center">
          You won't be charged until your {TRIAL_DAYS}-day trial ends. Cancel
          anytime before then.
        </Text>

        {prepareError && (
          <Text className="text-red-400 text-center text-sm">
            {prepareError}
          </Text>
        )}

        <Button
          size="lg"
          className="bg-brand-500 rounded-xl h-14 w-full"
          onPress={prepareError ? prepareSheet : handleStartTrial}
          disabled={
            isPreparing || isProcessing || (!sheetReady && !prepareError)
          }
        >
          <ButtonText className="text-background-900 font-semibold">
            {isPreparing
              ? "Preparing checkout..."
              : prepareError
                ? "Try again"
                : isProcessing
                  ? "Starting trial..."
                  : "Add card & start trial"}
          </ButtonText>
        </Button>
      </VStack>
    </SafeAreaView>
  );
}
