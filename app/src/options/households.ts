import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type {
  CreateMyHouseholdInput,
  JoinMyHouseholdInput,
} from "@shared/schemas/household-schema";
import {
  createHousehold,
  fetchMyHouseholds,
  getActiveHouseholdId,
  joinHousehold,
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

export const switchHouseholdMutationOptions = mutationOptions({
  mutationKey: ["households", "switch"],
  mutationFn: setActiveHouseholdId,
  onSuccess: (_data, householdId, _onMutateResult, { client: queryClient }) =>
    queryClient.setQueryData(
      activeHouseholdIdQueryOptions.queryKey,
      householdId,
    ),
});
// The new household becomes the active one. The households list is not
// invalidated here, so the create screen can show the code first
export const createHouseholdMutationOptions = mutationOptions({
  mutationKey: ["households", "create"],
  mutationFn: async (input: CreateMyHouseholdInput) => {
    const household = await createHousehold(input);
    await setActiveHouseholdId(household.id);
    return household;
  },
});

// The joined household becomes the active one. Refetching the list flips the
// guard in _layout, which opens the tabs
export const joinHouseholdMutationOptions = mutationOptions({
  mutationKey: ["households", "join"],
  mutationFn: async (input: JoinMyHouseholdInput) => {
    const household = await joinHousehold(input);
    await setActiveHouseholdId(household.id);
    return household;
  },
  onSuccess: (_data, _input, _onMutateResult, { client: queryClient }) =>
    queryClient.invalidateQueries({
      queryKey: householdsQueryOptions.queryKey,
    }),
});
