import { useQuery } from "@tanstack/react-query";

import { activeHouseholdIdQueryOptions } from "@/options/households";

// Single source of the active household; the root guard will hook in here later
export default function useActiveHouseholdId() {
  return useQuery(activeHouseholdIdQueryOptions).data;
}
