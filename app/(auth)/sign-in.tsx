import {useSignIn} from '@clerk/clerk-expo'
import {useRouter} from 'expo-router'
import {Text} from 'react-native'
import React from 'react'
import {VStack} from "@/components/ui/vstack";
import {Input, InputField, InputIcon, InputSlot} from '@/components/ui/input';
import {EyeIcon, EyeOffIcon} from "@/components/ui/icon";
import {SafeAreaView} from "react-native-safe-area-context";
import {Heading} from "@/components/ui/heading";
import {FormControl, FormControlLabelText} from "@/components/ui/form-control";
import {Button, ButtonText} from "@/components/ui/button";


export default function Page() {
    const {signIn, setActive, isLoaded} = useSignIn()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    // TODO: check how to integrate and add error handling
    const [isInvalid, setIsInvalid] = React.useState(false);


    // Handle the submission of the sign-in form
    const onSignInPress = async () => {
        if (!isLoaded) return

        // Start the sign-in process using the email and password provided
        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            })

            // If sign-in process is complete, set the created session as active
            // and redirect the user
            if (signInAttempt.status === 'complete') {
                await setActive({session: signInAttempt.createdSessionId})
                router.replace('/')
            } else {
                // If the status isn't complete, check why. User might need to
                // complete further steps.
                console.error(JSON.stringify(signInAttempt, null, 2))
            }
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2))
        }
    }
    const [showPassword, setShowPassword] = React.useState(false);
    const handleState = () => {
        setShowPassword((showState) => {
            return !showState;
        });
    }

    return (
        <SafeAreaView>
            <FormControl className="p-4 border border-outline-200 rounded-lg w-full">
                <VStack className="gap-4">
                    <Heading className="text-typography-900">Sign In</Heading>
                    <VStack space="xs">
                        <FormControlLabelText className="text-typography-500">Email</FormControlLabelText>
                        <Input>
                            <InputField type="text" value={emailAddress}
                                        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}/>
                        </Input>
                    </VStack>
                    <VStack space="xs">
                        <Text className="text-typography-500">Password</Text>
                        <Input textAlign="center">
                            <InputField
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChangeText={(password) => setPassword(password)}
                            />
                            <InputSlot className="pr-3" onPress={handleState}>
                                <InputIcon as={showPassword ? EyeIcon : EyeOffIcon}/>
                            </InputSlot>
                        </Input>
                    </VStack>
                    <Button className="ml-auto" onPress={onSignInPress}>
                        <ButtonText>Save</ButtonText>
                    </Button>
                </VStack>
            </FormControl>
            {/* Rest of the code remains unchanged

                <TextInput
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="Enter email"
                    onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                />
                <TextInput
                    value={password}
                    placeholder="Enter password"
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                />
                <TouchableOpacity onPress={onSignInPress}>
                    <Text>Continue</Text>
                </TouchableOpacity>
                <View style={{display: 'flex', flexDirection: 'row', gap: 3}}>
                    <Link href="/sign-up">
                        <Text>Sign up</Text>
                    </Link>
                </View>
                */}
        </SafeAreaView>
    )
}