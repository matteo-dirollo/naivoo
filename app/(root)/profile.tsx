import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { isClerkAPIResponseError } from "@clerk/clerk-expo";
import { ChevronLeft, LogOut } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import {
  Avatar,
  AvatarBadge,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { useTripStore } from "@/store";
import { useUserLocationStore } from "@/store";
import { useSubscriptionStore } from "@/store/subscriptionStore";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PlanStatus() {
  const { user } = useUser();
  const {
    status,
    trialEndsAt,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    isCancelling,
    cancelSubscription,
  } = useSubscriptionStore();

  const handleCancel = () => {
    if (!user?.id) return;
    Alert.alert(
      "Cancel your plan?",
      "You'll keep full access until the end of your current period. After that, you'll lose access to trip planning and navigation.",
      [
        { text: "Keep plan", style: "cancel" },
        {
          text: "Cancel plan",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription(user.id);
              Alert.alert(
                "Plan cancelled",
                "Your plan won't renew. You'll keep access until the current period ends.",
              );
            } catch {
              Alert.alert(
                "Couldn't cancel",
                "Something went wrong. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const renewalDate = formatDate(
    status === "trialing" ? trialEndsAt : currentPeriodEnd,
  );

  return (
    <VStack className="gap-3 border-t border-background-800 pt-6">
      <Text className="font-semibold text-background-500 text-sm uppercase tracking-widest">
        Subscription
      </Text>

      <HStack className="justify-between items-center">
        <Text className="text-background-200">
          {status === "trialing" ? "Free trial" : "Naivoo Pro"}
        </Text>
        <Text className="text-background-400 text-sm">
          {status === "trialing" ? "Trialing" : status}
        </Text>
      </HStack>

      {renewalDate && (
        <Text className="text-background-400 text-sm">
          {cancelAtPeriodEnd
            ? `Access ends ${renewalDate}`
            : status === "trialing"
              ? `First charge on ${renewalDate}`
              : `Renews ${renewalDate}`}
        </Text>
      )}

      {!cancelAtPeriodEnd && (
        <Button
          variant="outline"
          size="sm"
          className="border-red-500 rounded-md mt-2"
          onPress={handleCancel}
          disabled={isCancelling}
        >
          <ButtonText className="text-red-500">
            {isCancelling ? "Cancelling..." : "Cancel Plan"}
          </ButtonText>
        </Button>
      )}
    </VStack>
  );
}

function PasswordSection() {
  const { user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!user) return;

    setIsSaving(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your password has been changed.");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.longMessage ?? "Couldn't update password.");
      } else {
        setError("Couldn't update password. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VStack className="gap-3 border-t border-background-800 pt-6">
      <Text className="font-semibold text-background-500 text-sm uppercase tracking-widest">
        Change Password
      </Text>

      <Input className="bg-[#1F1F1F] rounded-xl">
        <InputField
          placeholder="Current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
      </Input>
      <Input className="bg-[#1F1F1F] rounded-xl">
        <InputField
          placeholder="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </Input>
      <Input className="bg-[#1F1F1F] rounded-xl">
        <InputField
          placeholder="Confirm new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </Input>

      {error && <Text className="text-red-400 text-sm">{error}</Text>}

      <Button
        variant="outline"
        size="sm"
        className="border-2 border-brand-500 rounded-md"
        onPress={handleSave}
        disabled={isSaving}
      >
        <ButtonText className="text-brand-500">
          {isSaving ? "Saving..." : "Update Password"}
        </ButtonText>
      </Button>
    </VStack>
  );
}

function EmailSection() {
  const { user } = useUser();
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestChange = async () => {
    setError(null);
    if (!user || !newEmail) return;

    setIsSaving(true);
    try {
      const emailAddress = await user.createEmailAddress({ email: newEmail });
      await emailAddress.prepareVerification({ strategy: "email_code" });
      setPendingEmailId(emailAddress.id);
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.longMessage ?? "Couldn't start email change.");
      } else {
        setError("Couldn't start email change. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    if (!user || !pendingEmailId) return;

    setIsSaving(true);
    try {
      const emailAddress = user.emailAddresses.find(
        (e) => e.id === pendingEmailId,
      );
      if (!emailAddress) throw new Error("Email not found");

      await emailAddress.attemptVerification({ code });
      await user.update({ primaryEmailAddressId: pendingEmailId });

      setPendingEmailId(null);
      setNewEmail("");
      setCode("");
      Alert.alert("Email updated", "Your email has been changed.");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.longMessage ?? "Invalid code.");
      } else {
        setError("Invalid code. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VStack className="gap-3 border-t border-background-800 pt-6">
      <Text className="font-semibold text-background-500 text-sm uppercase tracking-widest">
        Change Email
      </Text>

      {!pendingEmailId ? (
        <>
          <Input className="bg-[#1F1F1F] rounded-xl">
            <InputField
              placeholder="New email address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={newEmail}
              onChangeText={setNewEmail}
            />
          </Input>
          {error && <Text className="text-red-400 text-sm">{error}</Text>}
          <Button
            variant="outline"
            size="sm"
            className="border-2 border-brand-500 rounded-md"
            onPress={handleRequestChange}
            disabled={isSaving || !newEmail}
          >
            <ButtonText className="text-brand-500">
              {isSaving ? "Sending code..." : "Send Verification Code"}
            </ButtonText>
          </Button>
        </>
      ) : (
        <>
          <Text className="text-background-400 text-sm">
            Enter the code sent to {newEmail}.
          </Text>
          <Input className="bg-[#1F1F1F] rounded-xl">
            <InputField
              placeholder="Verification code"
              keyboardType="numeric"
              value={code}
              onChangeText={setCode}
            />
          </Input>
          {error && <Text className="text-red-400 text-sm">{error}</Text>}
          <Button
            variant="outline"
            size="sm"
            className="border-2 border-brand-500 rounded-md"
            onPress={handleVerifyCode}
            disabled={isSaving || !code}
          >
            <ButtonText className="text-brand-500">
              {isSaving ? "Verifying..." : "Confirm Email"}
            </ButtonText>
          </Button>
        </>
      )}
    </VStack>
  );
}

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
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

  return (
    <SafeAreaView className="flex-1 bg-[#141714]">
      <HStack className="items-center px-4 pt-2 pb-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft color="#fff" size={24} />
        </Pressable>
        <Heading className="text-white text-lg ml-1">Profile</Heading>
      </HStack>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <VStack className="gap-6">
          <VStack className="items-center gap-2">
            <Avatar size="xl">
              <AvatarFallbackText>{user?.firstName}</AvatarFallbackText>
              <AvatarImage source={{ uri: `${user?.imageUrl}` }} />
              <AvatarBadge />
            </Avatar>
            <Heading className="text-white text-xl">
              {user?.fullName ?? user?.firstName}
            </Heading>
            <Text className="text-background-400">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </VStack>

          <PlanStatus />
          <PasswordSection />
          <EmailSection />

          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 border-t border-background-800 pt-6 active:opacity-60"
          >
            <LogOut color="#ef4444" size={18} strokeWidth={1.5} />
            <Text className="text-red-500">Sign Out</Text>
          </Pressable>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
