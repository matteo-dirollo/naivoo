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

  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;

  // Handle the submission of the sign-in form
  const onSignInPress = useCallback(async () => {
    setErrors(undefined);
    const isEmailValid = emailRegex.test(form.email);
    const isPasswordValid = form.password.length >= 6;
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
        identifier: form.email,
        password: form.password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        // @ts-ignore
        router.replace("/(root)/(tabs)/home");
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
  }, [isLoaded, form]);

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
          alt={"image"}
          className="w-full h-64 mb-6"
        />
      </Box>

      <Box className="px-8 rounded-lg w-full">
        <VStack className="gap-4 mb-6">
          <Heading className="text-center text-typography-900">Sign In</Heading>
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
              <Box>
                {errors.map((el, index) => (
                  <Text key={index}>{el.longMessage}</Text>
                ))}
              </Box>
            )}
          </VStack>
          <VStack>
            <Button className="ml-auto w-full" onPress={onSignInPress}>
              <ButtonText>Sign In</ButtonText>
            </Button>
          </VStack>
        </VStack>
        <VStack
          className="mt-4"
          style={{ display: "flex", flexDirection: "row", gap: 3 }}
        >
          <Text className="text-center text-typography-500">
            Don&#39;t have an account?
          </Text>
          <Link href="/sign-up">
            <Text className="text-center text-typography-900 font-bold">
              Sign Up
            </Text>
          </Link>
        </VStack>
      </Box>
    </SafeAreaView>
  );
}
