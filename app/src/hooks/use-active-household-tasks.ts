import { useQuery } from "@tanstack/react-query";

import {
  activeHouseholdIdQueryOptions,
  householdsQueryOptions,
} from "@/options/households";
import { taskAssignmentsQueryOptions, tasksQueryOptions } from "@/options/tasks";

// Tasks, assignments and own membership for the active household
export default function useActiveHouseholdTasks() {
  const activeHousehold = useQuery(activeHouseholdIdQueryOptions);
  const householdId = activeHousehold.data;
  const tasks = useQuery(tasksQueryOptions(householdId));
  const households = useQuery(householdsQueryOptions);
  const assignments = useQuery(taskAssignmentsQueryOptions(householdId));
  const memberId = households.data?.find(
    (household) => household.id === householdId,
  )?.member.id;

  return {
    householdId,
    tasks: tasks.data,
    memberId,
    assignments: assignments.data ?? [],
    isPending:
      activeHousehold.isPending || (householdId !== null && tasks.isPending),
    error: activeHousehold.error ?? tasks.error,
    refetch: () =>
      activeHousehold.error ? activeHousehold.refetch() : tasks.refetch(),
  };
}
