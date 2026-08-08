import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import type { EmailCodeFactor } from "@clerk/types";
import { Link, useRouter } from "expo-router";
import { Text } from "react-native";
import { useCallback, useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heading } from "@/components/ui/heading";
import {
  FormControl,
  FormControlLabel,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Button, ButtonText } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { Pressable } from "react-native";
import { ClerkAPIError } from "@clerk/types";
import { Image } from "@/components/ui/image";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;

  // ── Forgot-password flow state ──────────────────────────────────────
  const [mode, setMode] = useState<
    "sign-in" | "reset-request" | "reset-confirm"
  >("sign-in");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const onSignInPress = useCallback(async () => {
    setErrors(undefined);
    const isEmailValid = emailRegex.test(form.email);
    const isPasswordValid = form.password.length >= 8;
    if (!isEmailValid) {
      setIsEmailInvalid(true);
      return;
    }
    if (!isPasswordValid) {
      setIsPasswordInvalid(true);
      return;
    }
    setIsEmailInvalid(false);
    setIsPasswordInvalid(false);

    if (!isLoaded || !signIn || !setActive) return;

    try {
      let signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
        strategy: "password",
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              return;
            }
            router.push("/(root)/(tabs)/home");
          },
        });
      }

      if (signInAttempt.status === "needs_second_factor") {
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor =>
            factor.strategy === "email_code",
        );

        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setNeeds2FA(true);
        }

        return;
      } else {
        console.warn(
          "Sign-in incomplete:",
          signInAttempt.status,
          signInAttempt,
        );
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
        console.error(JSON.stringify(err, null, 2));
      } else {
        console.error("Unknown error", err);
      }
    }
  }, [isLoaded, form]);

  const onTwoFactorSubmit = useCallback(async () => {
    if (!isLoaded || !signIn || !setActive) return;

    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: twoFactorCode,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              return;
            }
            router.push("/(root)/(tabs)/home");
          },
        });
      } else {
        console.warn("2FA incomplete", signInAttempt);
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
      } else {
        console.error("Unknown error", err);
      }
    }
  }, [isLoaded, twoFactorCode]);

  // ── Forgot-password handlers ─────────────────────────────────────────
  const onRequestReset = useCallback(async () => {
    setResetError(null);

    if (!emailRegex.test(resetEmail)) {
      setResetError("Please enter a valid email address.");
      return;
    }
    if (!isLoaded || !signIn) return;

    setIsResetting(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmail,
      });
      setMode("reset-confirm");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setResetError(
          err.errors[0]?.longMessage ?? "Couldn't send reset code.",
        );
      } else {
        setResetError("Couldn't send reset code. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  }, [isLoaded, signIn, resetEmail]);

  const onConfirmReset = useCallback(async () => {
    setResetError(null);

    if (newPassword.length < 8) {
      setResetError("New password must be at least 8 characters.");
      return;
    }
    if (!isLoaded || !signIn || !setActive) return;

    setIsResetting(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });

      if (attempt.status === "complete") {
        await setActive({
          session: attempt.createdSessionId,
          navigate: async () => {
            router.push("/(root)/(tabs)/home");
          },
        });
      } else {
        setResetError("Couldn't reset password. Please try again.");
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setResetError(err.errors[0]?.longMessage ?? "Invalid or expired code.");
      } else {
        setResetError("Invalid or expired code. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  }, [isLoaded, signIn, setActive, resetCode, newPassword]);

  const [showPassword, setShowPassword] = useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Reset flow screens ────────────────────────────────────────────
  if (mode === "reset-request") {
    return (
      <SafeAreaView className="flex-1 bg-[#181718]">
        <Box className="px-8 rounded-lg w-full mt-20">
          <VStack className="gap-4">
            <Heading className="text-center text-white text-2xl">
              Reset your password
            </Heading>
            <Text className="text-background-400 text-center">
              Enter your email and we'll send you a code to reset your password.
            </Text>

            <VStack space="xs">
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="text-background-300">
                    Email
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                  <InputField
                    type="text"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="text-white"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                  />
                </Input>
              </FormControl>
            </VStack>

            {resetError && (
              <Text className="text-red-400 text-sm">{resetError}</Text>
            )}

            <Button
              size="lg"
              className="bg-brand-500 rounded-xl h-14 mt-2"
              onPress={onRequestReset}
              disabled={isResetting}
            >
              <ButtonText className="text-background-900 font-semibold">
                {isResetting ? "Sending..." : "Send Reset Code"}
              </ButtonText>
            </Button>

            <Pressable
              onPress={() => {
                setMode("sign-in");
                setResetError(null);
              }}
              className="mt-2 items-center"
            >
              <Text className="text-brand-500 font-medium">
                Back to Sign In
              </Text>
            </Pressable>
          </VStack>
        </Box>
      </SafeAreaView>
    );
  }

  if (mode === "reset-confirm") {
    return (
      <SafeAreaView className="flex-1 bg-[#181718]">
        <Box className="px-8 rounded-lg w-full mt-20">
          <VStack className="gap-4">
            <Heading className="text-center text-white text-2xl">
              Enter your code
            </Heading>
            <Text className="text-background-400 text-center">
              We sent a code to {resetEmail}. Enter it below along with your new
              password.
            </Text>

            <VStack space="xs">
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="text-background-300">
                    Reset code
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                  <InputField
                    keyboardType="numeric"
                    className="text-white"
                    value={resetCode}
                    onChangeText={setResetCode}
                  />
                </Input>
              </FormControl>
            </VStack>

            <VStack space="xs">
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="text-background-300">
                    New password
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                  <InputField
                    type={showNewPassword ? "text" : "password"}
                    className="text-white"
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <InputSlot
                    onPress={() => setShowNewPassword((v) => !v)}
                    className="pr-3"
                  >
                    <InputIcon
                      as={showNewPassword ? EyeIcon : EyeOffIcon}
                      className="text-background-400"
                    />
                  </InputSlot>
                </Input>
                <FormControlHelper>
                  <FormControlHelperText className="text-background-500">
                    Minimum password length 8 characters
                  </FormControlHelperText>
                </FormControlHelper>
              </FormControl>
            </VStack>

            {resetError && (
              <Text className="text-red-400 text-sm">{resetError}</Text>
            )}

            <Button
              size="lg"
              className="bg-brand-500 rounded-xl h-14 mt-2"
              onPress={onConfirmReset}
              disabled={isResetting}
            >
              <ButtonText className="text-background-900 font-semibold">
                {isResetting ? "Resetting..." : "Reset Password"}
              </ButtonText>
            </Button>

            <Pressable
              onPress={() => {
                setMode("sign-in");
                setResetError(null);
              }}
              className="mt-2 items-center"
            >
              <Text className="text-brand-500 font-medium">
                Back to Sign In
              </Text>
            </Pressable>
          </VStack>
        </Box>
      </SafeAreaView>
    );
  }

  // ── Normal sign-in screen ────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#181718]">
      <Box className="w-full h-56 mb-6">
        <Image
          size={"2xl"}
          source={{
            uri: "https://images.unsplash.com/photo-1617721042495-04e739b9739d?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
          alt="image"
          className="w-full h-56"
        />
      </Box>

      <Box className="px-8 rounded-lg w-full">
        <VStack className="gap-4 mb-6">
          <Heading className="text-center text-white text-2xl">Sign In</Heading>
          {!needs2FA ? (
            <>
              <VStack space="xs">
                <FormControl isInvalid={isEmailInvalid}>
                  <FormControlLabel>
                    <FormControlLabelText className="text-background-300">
                      Email
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                    <InputField
                      type="text"
                      className="text-white"
                      value={form.email}
                      onChangeText={(v) => setForm({ ...form, email: v })}
                    />
                  </Input>
                  <FormControlError>
                    <FormControlErrorIcon
                      as={AlertCircleIcon}
                      className="text-red-400"
                    />
                    <FormControlErrorText className="text-red-400">
                      Please enter a valid email address.
                    </FormControlErrorText>
                  </FormControlError>
                </FormControl>
              </VStack>

              <VStack space="xs">
                <FormControl isInvalid={isPasswordInvalid}>
                  <FormControlLabel>
                    <FormControlLabelText className="text-background-300">
                      Password
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                    <InputField
                      type={showPassword ? "text" : "password"}
                      className="text-white"
                      value={form.password}
                      onChangeText={(v) => setForm({ ...form, password: v })}
                    />
                    <InputSlot onPress={handleState} className="pr-3">
                      <InputIcon
                        as={showPassword ? EyeIcon : EyeOffIcon}
                        className="text-background-400"
                      />
                    </InputSlot>
                  </Input>
                  <FormControlHelper>
                    <FormControlHelperText className="text-background-500">
                      Minimum password length 8 characters
                    </FormControlHelperText>
                  </FormControlHelper>
                </FormControl>
              </VStack>

              <Pressable
                onPress={() => {
                  setResetEmail(form.email);
                  setMode("reset-request");
                }}
                className="self-end -mt-2"
              >
                <Text className="text-brand-500 text-sm font-medium">
                  Forgot password?
                </Text>
              </Pressable>

              <Button
                size="lg"
                className="bg-brand-500 rounded-xl h-14"
                onPress={onSignInPress}
              >
                <ButtonText className="text-background-900 font-semibold">
                  Sign In
                </ButtonText>
              </Button>
            </>
          ) : (
            <>
              <VStack space="xs">
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-background-300">
                      Enter 2FA code
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                    <InputField
                      keyboardType="numeric"
                      className="text-white"
                      value={twoFactorCode}
                      onChangeText={setTwoFactorCode}
                    />
                  </Input>
                </FormControl>
              </VStack>

              <Button
                size="lg"
                className="bg-brand-500 rounded-xl h-14 mt-2"
                onPress={onTwoFactorSubmit}
              >
                <ButtonText className="text-background-900 font-semibold">
                  Verify Code
                </ButtonText>
              </Button>
            </>
          )}

          {errors &&
            errors.map((e, i) => (
              <Text key={i} className="text-red-400 text-sm">
                {e.longMessage}
              </Text>
            ))}

          <VStack
            className="mt-4"
            style={{ flexDirection: "row", gap: 3, justifyContent: "center" }}
          >
            <Text className="text-background-400">Don't have an account?</Text>
            <Link href="/sign-up">
              <Text className="font-bold text-brand-500">Sign Up</Text>
            </Link>
          </VStack>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
