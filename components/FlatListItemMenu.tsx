import React, { useEffect } from "react";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { MenuCategory, MenuState } from "@/types/type";
import { useMenuStore, useTripStore } from "@/store";
import { EllipsisIcon } from "lucide-react-native/dist/lucide-react-native.suffixed";
import { EllipsisVertical } from "lucide-react-native";

interface FlatListItemMenuProps {
  menuId: string;
  menuType: MenuCategory;
}

const FlatListItemMenu = ({ menuId, menuType }: FlatListItemMenuProps) => {
  const isOpen = useMenuStore((state) => state.isMenuOpen(menuId));
  const toggleMenu = useMenuStore((state) => state.toggleMenu);
  const { removeStop, setPriority, activeTrip, setTripInactive, deleteTrip } =
    useTripStore();
  const stop = activeTrip?.stops.find((s) => s.stop_id === menuId);
  const isLocked = stop?.isPrioritized ?? false;
  const tripId = activeTrip?.trip_id;

  return (
    <Menu
      className="p-1 bg-background-900 border-background-900 "
      isOpen={isOpen}
      onOpen={() => toggleMenu(menuId, menuType, true)}
      onClose={() => toggleMenu(menuId, menuType, false)}
      placement="bottom"
      offset={5}
      disabledKeys={["Settings"]}
      trigger={({ ...triggerProps }) => {
        return (
          <Button variant="link" size="md" className="p-0" {...triggerProps}>
            <ButtonIcon as={EllipsisVertical} className="text-white" />
          </Button>
        );
      }}
    >
      {menuId === "google-text-input" ? (
        <>
          <MenuItem
            key="New Trip"
            textValue="New Trip"
            onPress={() => {
              setTripInactive(tripId!);
              console.log("New Trip");
            }}
          >
            <MenuItemLabel className="text-white" size="sm">
              New Trip
            </MenuItemLabel>
          </MenuItem>
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
      ) : menuType === "stop" ? (
        <>
          <MenuItem
            key="Delete Stop"
            textValue="Delete Stop"
            onPress={() => {
              removeStop(menuId);
              toggleMenu(menuId, menuType, false);
            }}
          >
            <MenuItemLabel className="text-white" size="sm">
              Delete Stop
            </MenuItemLabel>
          </MenuItem>
          <MenuItem
            key="LockToggle"
            textValue={isLocked ? "Unlock Position" : "Lock Position"}
            onPress={() => {
              setPriority(menuId, !isLocked);
              toggleMenu(menuId, menuType, false);
            }}
          >
            <MenuItemLabel className="text-white" size="sm">
              {isLocked ? "🔓 Unlock Position" : "🔒 Lock Position"}
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
      ) : menuType === "trip" ? (
        <>
          <MenuItem
            key="Delete Trip"
            textValue="Delete Trip"
            onPress={() => deleteTrip(menuId)}
          >
            <MenuItemLabel className="text-white" size="sm">
              Delete Trip
            </MenuItemLabel>
          </MenuItem>
        </>
      ) : null}
    </Menu>
  );
};

export default FlatListItemMenu;
