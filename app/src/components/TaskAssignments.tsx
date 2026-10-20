import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import type { Member } from "@shared/schemas/member-schema";
import type { MemberToTask } from "@shared/schemas/member-to-task-schema";

type Props = {
  taskId: number;
  isOwner?: boolean;
  isPending?: boolean;
  onAssign?: (assignment: MemberToTask) => void;
  onRemove?: (assignment: MemberToTask) => void;
  assignments: readonly MemberToTask[];
  members: readonly (Pick<Member, "id" | "nickname" | "leftAt"> & {
    isPaused: boolean;
  })[];
};

export default function TaskAssignments({
  taskId,
  assignments,
  members,
  isOwner = false,
  isPending = false,
  onAssign,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const membersById = new Map(members.map((member) => [member.id, member]));
  const assignedMemberIds = new Set(
    assignments
      .filter((assignment) => assignment.taskId === taskId)
      .map((assignment) => assignment.memberId),
  );
  const activeMembers = members.filter(
    (member) => member.leftAt === null && !member.isPaused,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
        Tilldelade medlemmar
      </Text>
      {assignedMemberIds.size === 0 ? (
        <Text style={{ color: colors.textMuted }}>Inga tilldelningar ännu.</Text>
      ) : (
        Array.from(assignedMemberIds, (memberId) => {
          const member = membersById.get(memberId);
          return (
            <View key={memberId} style={styles.memberRow}>
              <Text style={[styles.memberName, { color: colors.text }]}>
                {member?.nickname ?? `Medlem #${memberId}`}
                {member?.isPaused ? " · Pausad" : ""}
              </Text>
              {isOwner && onRemove && (
                <Pressable
                  accessibilityRole="button"
                  disabled={isPending}
                  accessibilityState={{ disabled: isPending, busy: isPending }}
                  accessibilityLabel={`Ta bort tilldelning för ${member?.nickname ?? `Medlem #${memberId}`}`}
                  onPress={() => onRemove({ taskId, memberId })}
                  style={({ pressed }) => [
                    styles.action,
                    { opacity: isPending ? 0.5 : pressed ? 0.6 : 1 },
                  ]}>
                  <Text style={{ color: colors.primary }}>Ta bort</Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}

      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
        Aktiva medlemmar
      </Text>
      {activeMembers.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Inga aktiva medlemmar.</Text>
      ) : (
        activeMembers.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <Text style={[styles.memberName, { color: colors.text }]}>
              {member.nickname}
            </Text>
            {isOwner && onAssign && !assignedMemberIds.has(member.id) && (
              <Pressable
                accessibilityRole="button"
                disabled={isPending}
                accessibilityState={{ disabled: isPending, busy: isPending }}
                accessibilityLabel={`Tilldela sysslan till ${member.nickname}`}
                onPress={() => onAssign({ taskId, memberId: member.id })}
                style={({ pressed }) => [
                  styles.action,
                  { opacity: isPending ? 0.5 : pressed ? 0.6 : 1 },
                ]}>
                <Text style={{ color: colors.primary }}>Tilldela</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberName: {
    flex: 1,
  },
  action: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
});

// TODO(#51): Visa laddning och fel inline samt hindra upprepade ändringar medan sparande pågår.
// TODO(#51): Uppdatera visade tilldelningar efter att servern har bekräftat ändringen.
// TODO(#51): Följ befintligt tema och verifiera tillgänglighet på mobil.
