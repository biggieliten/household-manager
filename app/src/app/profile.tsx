import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AvatarPicker from "@/components/AvatarPicker";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { updateMyAvatar } from "@/lib/api/households";
import { signOutMutationOptions } from "@/options/auth";
import { householdQueryOptions } from "@/options/households";
import { ThemePicker, useTheme } from "@/theme";
import type { Avatar } from "@shared/schemas/member-schema";

export default function Profile() {
  const { colors } = useTheme();
  const signOutMutation = useMutation(signOutMutationOptions);
  const queryClient = useQueryClient();
  const householdId = useActiveHouseholdId();
  const { data: household } = useQuery(householdQueryOptions(householdId));

  const avatarMutation = useMutation({
    mutationFn: (avatar: Avatar) => {
      if (!householdId) throw new Error("Inget aktivt hushåll");
      return updateMyAvatar(householdId, avatar);
    },
    // Every screen showing members refetches with the new avatar
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["households"] }),
  });

  // The avatar belongs to the membership, so it is changed per household
  const me = household?.members.find((member) => member.isMe);
  const taken = household?.members
    .filter((member) => !member.isMe)
    .map((member) => member.avatar);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {me && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Avatar i {household?.name}
          </Text>
          <AvatarPicker
            value={me.avatar}
            onChange={(avatar) => avatarMutation.mutate(avatar)}
            disabled={avatarMutation.isPending}
            taken={taken}
          />
          {avatarMutation.error && (
            <Text style={{ color: colors.textMuted }}>
              {avatarMutation.error.message}
            </Text>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Utseende
        </Text>
        <ThemePicker />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: signOutMutation.isPending }}
        disabled={signOutMutation.isPending}
        onPress={() => signOutMutation.mutate()}
        style={[
          styles.signOut,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <Text style={[styles.signOutText, { color: colors.signOut }]}>Logga ut</Text>
      </Pressable>

      {signOutMutation.error && (
        <Text style={[styles.error, { color: colors.text }]}>
          {signOutMutation.error.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 32,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  signOut: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  signOutText: {
    fontSize: 17,
    fontWeight: "600",
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
});
