import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text } from "react-native";
import React from "react";
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

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  // TODO: check how to integrate and add error handling
  const [isEmailInvalid, setIsEmailInvalid] = React.useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = React.useState(false);
  const [errors, setErrors] = React.useState<ClerkAPIError[]>();

  // Handle the submission of the sign-in form
  const onSignInPress = async (e: React.FormEvent) => {
    const emailRegex =
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
    const isEmailValid = emailRegex.test(emailAddress);
    const isPasswordValid = password.length >= 6;
    e.preventDefault();

    // Clear any errors that may have occurred during previous form submission
    setErrors(undefined);

    if (!isEmailValid) {
      setIsEmailInvalid(true);

      return;
    }
    if (!isPasswordValid) {
      setIsPasswordInvalid(true);
      return;
    } else {
      setIsEmailInvalid(false);
      setIsPasswordInvalid(false);
    }
    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  };
  const [showPassword, setShowPassword] = React.useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  return (
    <SafeAreaView>
      <Box className="p-4 border border-outline-200 rounded-lg w-full">
        <VStack className="gap-4">
          <Heading className="text-typography-900">Sign In</Heading>
          <VStack space="xs">
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
                  value={emailAddress}
                  onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                />
              </Input>
              <FormControlHelper>
                <FormControlHelperText>{""}</FormControlHelperText>
              </FormControlHelper>
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
          <VStack space="xs">
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
                  value={password}
                  onChangeText={(password) => setPassword(password)}
                />
                <InputSlot className="pr-3" onPress={handleState}>
                  <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                </InputSlot>
              </Input>
              <FormControlHelper>
                <FormControlHelperText>
                  Must be at least 6 characters.
                </FormControlHelperText>
              </FormControlHelper>
              <FormControlError>
                <FormControlErrorIcon
                  as={AlertCircleIcon}
                  className="text-red-500"
                />
                <FormControlErrorText className="text-red-500">
                  At least 6 characters are required.
                </FormControlErrorText>
              </FormControlError>
            </FormControl>
          </VStack>
          <VStack>
            {errors && (
              <ul>
                {errors.map((el, index) => (
                  <li key={index}>{el.longMessage}</li>
                ))}
              </ul>
            )}
          </VStack>
          <Button className="ml-auto" onPress={onSignInPress}>
            <ButtonText>Sign In</ButtonText>
          </Button>
        </VStack>
        <VStack style={{ display: "flex", flexDirection: "row", gap: 3 }}>
          <Link href="/sign-up">
            <Text>Sign up</Text>
          </Link>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
