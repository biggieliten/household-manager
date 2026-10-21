import { mutationOptions, queryOptions, skipToken } from "@tanstack/react-query";
import type {
  CreateMyHouseholdInput,
  JoinMyHouseholdInput,
} from "@shared/schemas/household-schema";
import {
  createHousehold,
  fetchHousehold,
  fetchMyHouseholds,
  getActiveHouseholdId,
  joinHousehold,
  setActiveHouseholdId,
  updateMyNickname,
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

// Only a direct membership makes the household active; pending requests wait.
export const joinHouseholdMutationOptions = mutationOptions({
  mutationKey: ["households", "join"],
  mutationFn: async (input: JoinMyHouseholdInput) => {
    const result = await joinHousehold(input);
    if ("member" in result) {
      await setActiveHouseholdId(result.id);
    }
    return result;
  },
  onSuccess: (_data, _input, _onMutateResult, { client: queryClient }) =>
    queryClient.invalidateQueries({
      queryKey: householdsQueryOptions.queryKey,
    }),
});

export const updateMyNicknameMutationOptions = mutationOptions({
  mutationKey: ["households", "rename"],
  mutationFn: ({
    householdId,
    nickname,
  }: {
    householdId: number;
    nickname: string;
  }) => updateMyNickname(householdId, nickname),
  onSuccess: (_data, _input, _onMutateResult, { client: queryClient }) =>
    queryClient.invalidateQueries({
      queryKey: householdsQueryOptions.queryKey,
    }),
});
