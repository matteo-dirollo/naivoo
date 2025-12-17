import React from "react";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { EditIcon, Icon } from "@/components/ui/icon";
import { FormControl } from "@/components/ui/form-control";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import moment from "moment";
import { useUserLocationStore, useTripStore } from "@/store";
import { useUser } from "@clerk/clerk-expo";
import * as Crypto from "expo-crypto";

const NameTripField = ({ handlePress }: { handlePress: () => void }) => {
  const date = moment().format("dddd DD/MM/YYYY hh:mm A");
  const { user } = useUser();
  const { currentUserLocation } = useUserLocationStore();
  const [prefilledInputValue, setPrefilledInputValue] = React.useState(date);
  const UUID = Crypto.randomUUID();

  const { createTrip } = useTripStore();

  const handlePressNext = async () => {
    if (!currentUserLocation) {
      // Handle missing location - maybe show an alert
      console.error("Location not available");
      return;
    }

    if (!user?.id) {
      // Handle missing user - maybe show an alert
      console.error("User not authenticated");
      return;
    }
    await createTrip({
      name: prefilledInputValue,
      trip_id: UUID,
      user_id: user.id,
      start_location: currentUserLocation,
      // These will be handled by the API with defaults,
      // or you can be explicit:
      active_trip: true,
      created_at: new Date().toISOString(),
      stops: [],
      return_to_start: false,
      optimized_order: [],
      total_distance_km: 0,
      total_duration_min: 0,
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
