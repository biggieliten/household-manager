import { queryOptions, skipToken } from "@tanstack/react-query";
import { fetchTaskGroups } from "@/lib/api/task-groups";

export const taskGroupsQueryOptions = (householdId: number | null | undefined) =>
  queryOptions({
    queryKey: ["households", householdId, "task-groups"],
    queryFn: householdId ? () => fetchTaskGroups(householdId) : skipToken,
  });
