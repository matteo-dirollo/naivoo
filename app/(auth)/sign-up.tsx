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
  // const [showSuccessModal, setShowSuccessModal] = useState(false);
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

  // Handle submission of sign-up form
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

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
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
        // If the status is not complete, check why. User may need to
        // complete further steps.
        // console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView>
        <Box className="px-8 rounded-lg w-full">
          <VStack>
            <Heading className="text-center text-typography-900">
              Verify your email
            </Heading>
          </VStack>
          <VStack>
            <FormControl
              isInvalid={false}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={true}
            >
              <FormControlLabel>
                <FormControlLabelText className="text-typography-500">
                  Enter your code here
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  type="text"
                  value={verification.code}
                  onChangeText={(code) =>
                    setVerification({ ...verification, code })
                  }
                />
              </Input>
              <FormControlHelper>
                <FormControlHelperText>
                  Check your inbox, an email has been sent to {form.email}.
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>
          </VStack>
          <VStack>
            <Button className="ml-auto w-full" onPress={onVerifyPress}>
              <ButtonText>Verify</ButtonText>
            </Button>
          </VStack>
          <VStack>
            {verification.error && (
              <Box>
                <Text>{verification.error}</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </SafeAreaView>
    );
  }

  // @ts-ignore
  return (
    <SafeAreaView>
      <Box className="w-full h-64 bg-image-500 mb-8">
        <Image
          size={"2xl"}
          source={{
            uri: "https://images.unsplash.com/photo-1617721042495-04e739b9739d?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
          alt={"image"}
          className="w-full h-64 mb-6"
        />
      </Box>
      <Box className="px-8 rounded-lg w-full">
        <VStack className="gap-4 mb-6">
          <Heading className="text-center text-typography-900">Sign Up</Heading>
          <VStack id="name-input">
            <FormControl
              isInvalid={isUserNameValid}
              size="md"
              isDisabled={false}
              isReadOnly={false}
              isRequired={false}
            >
              <FormControlLabel>
                <FormControlLabelText className="text-typography-500">
                  Name
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  type="text"
                  value={form.name}
                  onChangeText={(value) => setForm({ ...form, name: value })}
                />
              </Input>
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
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
                <FormControlLabelText className="text-typography-500">
                  Email
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  type="text"
                  value={form.email}
                  onChangeText={(value) => setForm({ ...form, email: value })}
                />
              </Input>

              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
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
                <FormControlLabelText className="text-typography-500">
                  Password
                </FormControlLabelText>
              </FormControlLabel>

              {/*@ts-ignore*/}
              <Input textAlign="center">
                <InputField
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChangeText={(value) =>
                    setForm({ ...form, password: value })
                  }
                />
                <InputSlot className="pr-3" onPress={handleState}>
                  <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                </InputSlot>
              </Input>
              <FormControlHelper>
                <FormControlHelperText>
                  Minimum password length 8 characters.
                </FormControlHelperText>
              </FormControlHelper>
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
                  Password too short and/or missing one special character.
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          </VStack>
          <VStack id="errors-box">
            {errors && (
              <Box>
                {errors.map((el, index) => (
                  <Text key={index}>{el.longMessage}</Text>
                ))}
              </Box>
            )}
          </VStack>
          <VStack id="submit-button">
            <Button className="ml-auto w-full" onPress={onSignUpPress}>
              <ButtonText>Sign Up</ButtonText>
            </Button>
          </VStack>
        </VStack>
        <VStack
          className="mt-4"
          style={{ display: "flex", flexDirection: "row", gap: 3 }}
        >
          <Text className="text-center text-typography-500">
            Already have an account?
          </Text>
          <Link href="/sign-in">
            <Text className="text-center text-typography-900 font-bold">
              Sign In
            </Text>
          </Link>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
