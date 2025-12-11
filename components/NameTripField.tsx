import React from "react";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { EditIcon, Icon } from "@/components/ui/icon";
import { FormControl } from "@/components/ui/form-control";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import moment from "moment";
import { useLocationStore, useTripStore } from "@/store";
import { useUser } from "@clerk/clerk-expo";

const NameTripField = ({ handlePress }: { handlePress: () => void }) => {
  const date = moment().format("dddd DD/MM/YYYY hh:mm A");
  const { user } = useUser();
  const { currentUserAddress, currentUserLatitude, currentUserLongitude } =
    useLocationStore();
  const [prefilledInputValue, setPrefilledInputValue] = React.useState(date);

  const { createTrip } = useTripStore();

  const handlePressNext = async () => {
    // @ts-ignore
    await createTrip({
      name: prefilledInputValue,
      user_id: user?.id,
      start_address: currentUserAddress || "Unknown Address",
      start_latitude: currentUserLatitude || 0,
      start_longitude: currentUserLongitude || 0,
    });
  };

  return (
    <VStack className="flex-1 w-full mx-10">
      <FormControl className="flex-1 mx-10">
        <VStack className="flex-1 items-center justify-center">
          <Input
            variant="outline"
            size="lg"
            isDisabled={false}
            isInvalid={false}
            isFocused={false}
            isReadOnly={false}
            onFocus={handlePress}
            className="flex-1 w-full"
          >
            <InputSlot className="pl-3">
              <InputIcon as={EditIcon} />
            </InputSlot>

            <InputField
              value={prefilledInputValue}
              onChangeText={setPrefilledInputValue}
              className="text-white"
              placeholder="Name your next trip..."
            />
          </Input>
          <Button
            className="ml-auto mt-6 bg-green-600 rounded-md w-full"
            onPress={handlePressNext}
          >
            <ButtonText>Next</ButtonText>
          </Button>
        </VStack>
      </FormControl>
    </VStack>
  );
};

export default NameTripField;
