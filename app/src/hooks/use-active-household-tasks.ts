import { useQuery } from "@tanstack/react-query";

import { activeHouseholdIdQueryOptions } from "@/options/households";
import { tasksQueryOptions } from "@/options/tasks";

// Tasks for the active household, with one loading/error state for both queries
export default function useActiveHouseholdTasks() {
  const activeHousehold = useQuery(activeHouseholdIdQueryOptions);
  const householdId = activeHousehold.data;
  const tasks = useQuery(tasksQueryOptions(householdId));

  return {
    householdId,
    tasks: tasks.data,
    isPending:
      activeHousehold.isPending || (householdId !== null && tasks.isPending),
    error: activeHousehold.error ?? tasks.error,
    refetch: () =>
      activeHousehold.error ? activeHousehold.refetch() : tasks.refetch(),
  };
}
