import React from "react";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { EditIcon, Icon } from "@/components/ui/icon";
import { FormControl } from "@/components/ui/form-control";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";

const CreateTripField = ({ handlePress }: { handlePress: () => void }) => {
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
              className="text-white"
              placeholder="Name your next trip..."
            />
          </Input>
          <Button className="ml-auto mt-6 bg-green-600 rounded-md w-full">
            <ButtonText>Next</ButtonText>
          </Button>
        </VStack>
      </FormControl>
    </VStack>
  );
};

export default CreateTripField;
