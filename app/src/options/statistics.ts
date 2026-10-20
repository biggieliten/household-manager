import { queryOptions, skipToken } from "@tanstack/react-query";

import { fetchHouseholdStatistics } from "@/lib/api/statistics";
import type { StatisticsPeriod } from "@/lib/statistics-period";

// skipToken waits until the active household is known
export const statisticsQueryOptions = (
  householdId: number | null | undefined,
  period: StatisticsPeriod,
) =>
  queryOptions({
    queryKey: [
      "households",
      householdId,
      "statistics",
      period.from.toISOString(),
      period.to.toISOString(),
    ],
    queryFn: householdId
      ? () => fetchHouseholdStatistics(householdId, period)
      : skipToken,
  });
