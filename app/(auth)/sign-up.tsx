import * as React from "react";
import { isClerkAPIResponseError, useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Heading } from "@/components/ui/heading";
import {
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Image } from "@/components/ui/image";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { ClerkAPIError } from "@clerk/types";
import { Button, ButtonText } from "@/components/ui/button";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { fetchAPI } from "@/lib/fetch";

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [isUserNameValid, setIsUserNameValid] = useState(false);
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
  const nameRegex =
    /^([a-zA-Z -]{2,}\s[a-zA-z]{1,}'?-?[a-zA-Z]{2,}\s?([a-zA-Z]{1,})?)/;

  const [showPassword, setShowPassword] = React.useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const onSignUpPress = async () => {
    const isNameValid = nameRegex.test(form.name);
    const isEmailValid = emailRegex.test(form.email);
    const isPasswordValid = form.password.length >= 8;

    setErrors(undefined);

    if (!isNameValid) {
      setIsUserNameValid(true);
      return;
    }
    if (!isEmailValid) {
      setIsEmailInvalid(true);
      return;
    }
    if (!isPasswordValid) {
      setIsPasswordInvalid(true);
      return;
    } else {
      setIsUserNameValid(false);
      setIsEmailInvalid(false);
      setIsPasswordInvalid(false);
    }
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
      setPendingVerification(true);
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (signUpAttempt.status === "complete") {
        await fetchAPI("/(api)/user", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: signUpAttempt.createdUserId,
          }),
        });
        await setActive({ session: signUpAttempt.createdSessionId });
        setVerification({
          ...verification,
          state: "success",
        });
        router.push("/(root)/(tabs)/home");
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-[#181718]">
        <Box className="px-8 rounded-lg w-full mt-16">
          <VStack className="gap-4">
            <Heading className="text-center text-white text-2xl">
              Verify your email
            </Heading>
          </VStack>
          <VStack className="mt-6">
            <FormControl
              isInvalid={false}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={true}
            >
              <FormControlLabel>
                <FormControlLabelText className="text-background-300">
                  Enter your code here
                </FormControlLabelText>
              </FormControlLabel>
              <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                <InputField
                  type="text"
                  className="text-white"
                  value={verification.code}
                  onChangeText={(code) =>
                    setVerification({ ...verification, code })
                  }
                />
              </Input>
              <FormControlHelper>
                <FormControlHelperText className="text-background-500">
                  Check your inbox, an email has been sent to {form.email}.
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>
          </VStack>
          <VStack className="mt-4">
            <Button
              size="lg"
              className="bg-brand-500 rounded-xl h-14 w-full"
              onPress={onVerifyPress}
            >
              <ButtonText className="text-background-900 font-semibold">
                Verify
              </ButtonText>
            </Button>
          </VStack>
          <VStack className="mt-3">
            {verification.error && (
              <Box>
                <Text className="text-red-400 text-sm">
                  {verification.error}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </SafeAreaView>
    );
  }

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
          <Heading className="text-center text-white text-2xl">Sign Up</Heading>
          <VStack id="name-input">
            <FormControl
              isInvalid={isUserNameValid}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={false}
            >
              <FormControlLabel>
                <FormControlLabelText className="text-background-300">
                  Name
                </FormControlLabelText>
              </FormControlLabel>
              <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                <InputField
                  type="text"
                  className="text-white"
                  value={form.name}
                  onChangeText={(value) => setForm({ ...form, name: value })}
                />
              </Input>
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-400"
                />
                <FormControlErrorText className="text-red-400">
                  Enter a valid name.
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          </VStack>
          <VStack id="email-input">
            <FormControl
              isInvalid={isEmailInvalid}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={false}
            >
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
                  onChangeText={(value) => setForm({ ...form, email: value })}
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
          <VStack id="password-input">
            <FormControl
              isInvalid={isPasswordInvalid}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={false}
            >
              <FormControlLabel>
                <FormControlLabelText className="text-background-300">
                  Password
                </FormControlLabelText>
              </FormControlLabel>

              {/*@ts-ignore*/}
              <Input className="bg-[#1F1F1F] border-background-800 rounded-xl">
                <InputField
                  type={showPassword ? "text" : "password"}
                  className="text-white text-center"
                  value={form.password}
                  onChangeText={(value) =>
                    setForm({ ...form, password: value })
                  }
                />
                <InputSlot className="pr-3" onPress={handleState}>
                  <InputIcon
                    as={showPassword ? EyeIcon : EyeOffIcon}
                    className="text-background-400"
                  />
                </InputSlot>
              </Input>
              <FormControlHelper>
                <FormControlHelperText className="text-background-500">
                  Minimum password length 8 characters.
                </FormControlHelperText>
              </FormControlHelper>
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-400"
                />
                <FormControlErrorText className="text-red-400">
                  Password too short and/or missing one special character.
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          </VStack>
          <VStack id="errors-box">
            {errors && (
              <Box>
                {errors.map((el, index) => (
                  <Text key={index} className="text-red-400 text-sm">
                    {el.longMessage}
                  </Text>
                ))}
              </Box>
            )}
          </VStack>
          <VStack id="submit-button" className="mt-2">
            <Button
              size="lg"
              className="bg-brand-500 rounded-xl h-14 w-full"
              onPress={onSignUpPress}
            >
              <ButtonText className="text-background-900 font-semibold">
                Sign Up
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
        <VStack
          className="mt-4"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 3,
            justifyContent: "center",
          }}
        >
          <Text className="text-center text-background-400">
            Already have an account?
          </Text>
          <Link href="/sign-in">
            <Text className="text-center text-brand-500 font-bold">
              Sign In
            </Text>
          </Link>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
