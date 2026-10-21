import { mutationOptions } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

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
