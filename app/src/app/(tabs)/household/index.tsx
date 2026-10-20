import { Redirect } from "expo-router";

import { HOUSEHOLD_ID } from "@/lib/api/client";

export default function HouseholdIndex() {
  return (
    <Redirect
      href={{ pathname: "/household/[id]", params: { id: HOUSEHOLD_ID } }}
    />
  );
}
