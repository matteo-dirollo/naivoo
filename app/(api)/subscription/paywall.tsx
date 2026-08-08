import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Check } from "lucide-react-native";
import { TRIAL_DAYS } from "@/constants";

const PLAN_PRICE = "€6.99/mo";

const FEATURES = [
  "Unlimited trips and stops",
  "Multi-stop route optimization",
  "Turn-by-turn navigation mode",
  "Avoid highways & round-trip routing",
];

export default function Paywall() {
  return (
    <SafeAreaView className="flex-1 bg-[#141714] px-6">
      <VStack className="flex-1 justify-between py-10">
        <VStack className="gap-6">
          <Heading className="text-white text-3xl text-center">
            Try Naivoo free for {TRIAL_DAYS} days
          </Heading>
          <Text className="text-background-300 text-center">
            Then {PLAN_PRICE}. Cancel anytime before your trial ends and you
            won't be charged.
          </Text>

          <VStack className="gap-3 mt-4">
            {FEATURES.map((feature) => (
              <View key={feature} className="flex-row items-center gap-3">
                <Check size={18} color="#1ed7b5" />
                <Text className="text-background-200 flex-1">{feature}</Text>
              </View>
            ))}
          </VStack>
        </VStack>

        <VStack className="gap-3">
          <Button
            size="lg"
            className="bg-brand-500 rounded-xl h-14"
            onPress={() => router.push("/(subscription)/checkout")}
          >
            <ButtonText className="text-background-900 font-semibold">
              Start Free Trial
            </ButtonText>
          </Button>
          <Text className="text-background-500 text-xs text-center">
            A card is required to start your trial. We'll remind you before it
            ends.
          </Text>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
}
