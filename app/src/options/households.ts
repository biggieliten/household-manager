import { mutationOptions, queryOptions, skipToken } from "@tanstack/react-query";

import {
  fetchHousehold,
  fetchMyHouseholds,
  getActiveHouseholdId,
  setActiveHouseholdId,
} from "@/lib/api/households";

export const householdsQueryOptions = queryOptions({
  queryKey: ["households"],
  queryFn: fetchMyHouseholds,
});

// Under ["households"] so invalidating the list re-checks the stored id
export const activeHouseholdIdQueryOptions = queryOptions({
  queryKey: ["households", "active-id"],
  queryFn: async ({ client: queryClient }) => {
    const households = await queryClient.query(householdsQueryOptions);
    return getActiveHouseholdId(households);
  },
  staleTime: Infinity,
});

// skipToken waits until the active household is known
export const householdQueryOptions = (householdId: number | null | undefined) =>
  queryOptions({
    queryKey: ["households", householdId],
    queryFn: householdId ? () => fetchHousehold(householdId) : skipToken,
  });

export const switchHouseholdMutationOptions = mutationOptions({
  mutationKey: ["households", "switch"],
  mutationFn: setActiveHouseholdId,
  onSuccess: (_data, householdId, _onMutateResult, { client: queryClient }) =>
    queryClient.setQueryData(
      activeHouseholdIdQueryOptions.queryKey,
      householdId,
    ),
});
