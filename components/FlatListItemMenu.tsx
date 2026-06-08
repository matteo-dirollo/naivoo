import React from "react";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { MenuState } from "@/types/type";
import { useMenuStore, useTripStore } from "@/store";
import { EllipsisIcon } from "lucide-react-native/dist/lucide-react-native.suffixed";
import { EllipsisVertical } from "lucide-react-native";

interface FlatListItemMenuProps {
  menuId: string;
}

const FlatListItemMenu = ({ menuId }: FlatListItemMenuProps) => {
  const isOpen = useMenuStore((state) => state.isMenuOpen(menuId));
  const toggleMenu = useMenuStore((state) => state.toggleMenu);
  const { removeStop } = useTripStore();
  return (
    <Menu
      className="p-1 bg-background-900 border-background-900 "
      isOpen={isOpen}
      onOpen={() => toggleMenu(menuId, true)}
      onClose={() => toggleMenu(menuId, false)}
      placement="bottom"
      offset={5}
      disabledKeys={["Settings"]}
      trigger={({ ...triggerProps }) => {
        return (
          <Button variant="link" size="sm" className="p-0" {...triggerProps}>
            <ButtonIcon as={EllipsisVertical} className="text-white" />
          </Button>
        );
      }}
    >
      {menuId === "google-text-input" ? (
        <>
          <MenuItem
            key="Skip Optimization"
            textValue="Skip Optimization"
            onPress={() => console.log("Skip Optimization")}
          >
            <MenuItemLabel className="text-white" size="sm">
              Skip Optimization
            </MenuItemLabel>
          </MenuItem>
          <MenuItem
            key="Reset Stop IDs"
            textValue="Reset Stop IDs"
            onPress={() => console.log("Reset Stop IDs")}
          >
            <MenuItemLabel className="text-white" size="sm">
              Reset Stop IDs
            </MenuItemLabel>
          </MenuItem>
          <MenuItem
            key="Remove all Stops"
            textValue="Remove all Stops"
            onPress={() => console.log("Remove all Stops")}
          >
            <MenuItemLabel className="text-white" size="sm">
              Remove all Stops
            </MenuItemLabel>
          </MenuItem>
          <MenuItem
            key="Delete Trip"
            textValue="Delete Trip"
            onPress={() => console.log("Delete Trip")}
          >
            <MenuItemLabel className="text-white" size="sm">
              Delete Trip
            </MenuItemLabel>
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem
            key="Delete Stop"
            textValue="Delete Stop"
            onPress={() => removeStop(menuId)}
          >
            <MenuItemLabel className="text-white" size="sm">
              Delete Stop
            </MenuItemLabel>
          </MenuItem>
          <MenuItem
            key="Modify Stop"
            textValue="Modify Stop"
            onPress={() => menuId}
          >
            <MenuItemLabel className="text-white" size="sm">
              Change Address
            </MenuItemLabel>
          </MenuItem>
          <MenuItem key="Change Position" textValue="Change Position">
            <MenuItemLabel className="text-white" size="sm">
              Order
            </MenuItemLabel>
          </MenuItem>
        </>
      )}
    </Menu>
  );
};

export default FlatListItemMenu;
