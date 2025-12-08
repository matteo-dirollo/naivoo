import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
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

  const onSignInPress = useCallback(async () => {
    // ... input validation etc ...
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

    // guard: ensure Clerk is loaded and signIn/setActive are defined
    if (!isLoaded || !signIn || !setActive) return;

    try {
      let signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
        strategy: "password", // explicitly set first-factor strategy
      });

      if (signInAttempt.status === "needs_second_factor") {
        setNeeds2FA(true);
        return; // wait for user to input 2FA code
      }

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push("/(root)/(tabs)/home");
      } else {
        console.warn(
          "Sign-in incomplete:",
          signInAttempt.status,
          signInAttempt,
        );
        // Optionally handle other statuses (needs_first_factor, needs_new_password, etc.)
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
        strategy: "totp", // or "phone_code" depending on your setup
        code: twoFactorCode,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Check for tasks and navigate to custom UI to help users resolve them
              console.log(session?.currentTask);
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
  }, [isLoaded, signIn, setActive, twoFactorCode, router]);

  const [showPassword, setShowPassword] = useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  return (
    <SafeAreaView>
      <Box className="w-full h-64 bg-image-500 mb-8">
        <Image
          size={"2xl"}
          source={{
            uri: "https://images.unsplash.com/photo-1617721042495-04e739b9739d?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
          alt="image"
          className="w-full h-64 mb-6"
        />
      </Box>

      <Box className="px-8 rounded-lg w-full">
        <VStack className="gap-4 mb-6">
          <Heading className="text-center text-typography-900">Sign In</Heading>
          {!needs2FA ? (
            <>
              <VStack space="xs">
                <FormControl isInvalid={isEmailInvalid}>
                  <FormControlLabel>
                    <FormControlLabelText>Email</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      type="text"
                      value={form.email}
                      onChangeText={(v) => setForm({ ...form, email: v })}
                    />
                  </Input>
                  <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText>
                      Please enter a valid email address.
                    </FormControlErrorText>
                  </FormControlError>
                </FormControl>
              </VStack>

              <VStack space="xs">
                <FormControl isInvalid={isPasswordInvalid}>
                  <FormControlLabel>
                    <FormControlLabelText>Password</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChangeText={(v) => setForm({ ...form, password: v })}
                    />
                    <InputSlot onPress={handleState}>
                      <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                    </InputSlot>
                  </Input>
                  <FormControlHelper>
                    <FormControlHelperText>
                      Minimum password length 8 characters
                    </FormControlHelperText>
                  </FormControlHelper>
                </FormControl>
              </VStack>

              <Button onPress={onSignInPress}>
                <ButtonText>Sign In</ButtonText>
              </Button>
            </>
          ) : (
            <>
              <VStack space="xs">
                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText>Enter 2FA code</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      keyboardType="numeric"
                      value={twoFactorCode}
                      onChangeText={setTwoFactorCode}
                    />
                  </Input>
                </FormControl>
              </VStack>

              <Button onPress={onTwoFactorSubmit}>
                <ButtonText>Verify Code</ButtonText>
              </Button>
            </>
          )}

          {errors && errors.map((e, i) => <Text key={i}>{e.longMessage}</Text>)}

          <VStack className="mt-4" style={{ flexDirection: "row", gap: 3 }}>
            <Text>Don't have an account?</Text>
            <Link href="/sign-up">
              <Text className="font-bold">Sign Up</Text>
            </Link>
          </VStack>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
