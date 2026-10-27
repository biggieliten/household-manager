import { useQuery } from "@tanstack/react-query";

import { activeHouseholdIdQueryOptions } from "@/options/households";

export default function useActiveHouseholdId() {
  return useQuery(activeHouseholdIdQueryOptions).data;
}
