import { queryOptions, skipToken } from "@tanstack/react-query";

import { fetchTaskAssignments } from "@/lib/api/task-assignments";
import { fetchHouseholdTasks, getTaskById } from "@/lib/api/tasks";

// skipToken waits until the active household (and task id) is known
export const tasksQueryOptions = (householdId: number | null | undefined) =>
  queryOptions({
    queryKey: ["households", householdId, "tasks"],
    queryFn: householdId ? () => fetchHouseholdTasks(householdId) : skipToken,
  });

export const taskAssignmentsQueryOptions = (
  householdId: number | null | undefined,
) =>
  queryOptions({
    queryKey: ["households", householdId, "task-assignments"],
    queryFn: householdId
      ? () => fetchTaskAssignments(householdId)
      : skipToken,
  });

export const taskQueryOptions = (
  householdId: number | null | undefined,
  taskId: number | undefined,
) =>
  queryOptions({
    queryKey: ["households", householdId, "tasks", taskId],
    queryFn:
      householdId && taskId
        ? () => getTaskById(householdId, taskId)
        : skipToken,
  });
