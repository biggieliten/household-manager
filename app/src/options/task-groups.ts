import { mutationOptions, queryOptions, skipToken } from "@tanstack/react-query";
import { deleteTaskGroup, fetchTaskGroups } from "@/lib/api/task-groups";

export const taskGroupsQueryOptions = (householdId: number | null | undefined) =>
  queryOptions({
    queryKey: ["households", householdId, "task-groups"],
    queryFn: householdId ? () => fetchTaskGroups(householdId) : skipToken,
  });

export const deleteTaskGroupMutationOptions = mutationOptions({
  mutationKey: ["households", "task-groups", "delete"],
  mutationFn: ({
    householdId,
    groupId,
  }: {
    householdId: number;
    groupId: number;
  }) => deleteTaskGroup(householdId, groupId),
  onSuccess: (_data, { householdId }, _onMutateResult, { client }) =>
    client.invalidateQueries({
      queryKey: ["households", householdId],
    }),
});
