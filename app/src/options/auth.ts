import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { getAuthHeaders } from "@/lib/api/client";
import { authClient } from "@/lib/auth-client";

// The cookie for expo-image / expo-audio, which load task media straight from
// the API; cleared with the rest of the cache on sign-out
export const authHeadersQueryOptions = queryOptions({
  queryKey: ["auth", "headers"],
  queryFn: getAuthHeaders,
});

export const signOutMutationOptions = mutationOptions({
  mutationKey: ["sign-out"],
  // Network failures throw, server errors come back as { error }
  mutationFn: async () => {
    const { error } = await authClient
      .signOut()
      .catch(() => ({ error: true }));
    if (error) throw new Error("Kunde inte logga ut");
  },
  // The next user must not see this user's cached data
  onSuccess: (_data, _input, _onMutateResult, { client: queryClient }) =>
    queryClient.clear(),
});
