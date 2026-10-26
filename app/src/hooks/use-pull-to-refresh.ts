import { useState } from "react";

// Spinner state for a RefreshControl that only turns on when the user pulls.
// Tying `refreshing` to React Query's isRefetching/isFetching also shows it for
// background refetches, including on tabs that aren't visible
export default function usePullToRefresh(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
