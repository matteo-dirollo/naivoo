import React from "react";
import { useUser } from "@clerk/clerk-expo";

const TripsHistory = () => {
  const { user } = useUser();
  return <div>List of Trips</div>;
};

export default TripsHistory;
