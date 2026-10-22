import { Pressable, StyleSheet, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import { useTheme } from "@/theme";
import type { Avatar as AvatarType } from "@shared/schemas/member-schema";

type Props = {
  members: readonly {
    id: number;
    nickname: string;
    avatar: AvatarType;
    isPaused: boolean;
  }[];
  selectedMemberIds: ReadonlySet<number>;
  isPending: boolean;
  onToggle: (memberId: number) => void;
};

export default function TaskMemberPicker({
  members,
  selectedMemberIds,
  isPending,
  onToggle,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={{ color: colors.textMuted }}>
        Tryck för att tilldela eller ta bort en manuell tilldelning.
        Grupptilldelningar ändras i gruppen.
      </Text>
      <View style={styles.avatars}>
        {members.length === 0 && (
          <Text style={{ color: colors.textMuted }}>Inga medlemmar.</Text>
        )}
        {members.map((member) => {
          const selected = selectedMemberIds.has(member.id);
          return (
            <Pressable
              key={member.id}
              accessibilityRole="checkbox"
              accessibilityLabel={`${member.nickname}${member.isPaused ? ", pausad" : ""}, manuell tilldelning`}
              accessibilityState={{
                checked: selected,
                disabled: isPending,
                busy: isPending,
              }}
              disabled={isPending}
              onPress={() => {
                if (!isPending) onToggle(member.id);
              }}
              style={({ pressed }) => [
                styles.action,
                { borderColor: selected ? colors.primary : colors.border },
                (isPending || pressed || member.isPaused) && styles.paused,
              ]}>
              <Avatar avatar={member.avatar} />
              {selected && (
                <Text
                  style={[
                    styles.checkmark,
                    { color: colors.primary, backgroundColor: colors.surface },
                  ]}>
                  ✓
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  avatars: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  action: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 24,
    padding: 5,
  },
  checkmark: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderRadius: 8,
    paddingHorizontal: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  paused: {
    opacity: 0.4,
  },
});
