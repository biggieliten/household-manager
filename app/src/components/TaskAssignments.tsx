import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import type { Member } from "@shared/schemas/member-schema";
import type {
  MemberToTask,
  TaskAssignment,
} from "@shared/schemas/member-to-task-schema";

type Props = {
  taskId: number;
  isOwner?: boolean;
  isPending?: boolean;
  error?: string;
  onAssign?: (assignment: MemberToTask) => void;
  onRemove?: (assignment: MemberToTask) => void;
  assignments: readonly TaskAssignment[];
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
  error,
  onAssign,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const membersById = new Map(members.map((member) => [member.id, member]));
  const taskAssignments = assignments.filter(
    (assignment) => assignment.taskId === taskId,
  );
  const manualMemberIds = new Set(
    taskAssignments
      .filter((assignment) => assignment.isManual)
      .map((assignment) => assignment.memberId),
  );
  const householdMembers = members.filter((member) => member.leftAt === null);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {isPending && (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted }}>
          Sparar…
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.text }}>
          {error}
        </Text>
      )}
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
        Tilldelade medlemmar
      </Text>
      {taskAssignments.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Inga tilldelningar ännu.</Text>
      ) : (
        taskAssignments.map(({ memberId, isManual, groups }) => {
          const member = membersById.get(memberId);
          return (
            <View key={memberId} style={styles.memberRow}>
              <Text style={[styles.memberName, { color: colors.text }]}>
                {member?.nickname ?? `Medlem #${memberId}`}
                {member?.isPaused ? " · Pausad" : ""}
                {isManual ? " · Manuellt" : ""}
                {groups.map((group) => ` · ${group.name}`).join("")}
              </Text>
              {isOwner && onRemove && isManual && (
                <Pressable
                  accessibilityRole="button"
                  disabled={isPending}
                  accessibilityState={{ disabled: isPending, busy: isPending }}
                  accessibilityLabel={`Ta bort manuell tilldelning för ${member?.nickname ?? `Medlem #${memberId}`}`}
                  onPress={() => {
                    if (!isPending) onRemove({ taskId, memberId });
                  }}
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
        Medlemmar
      </Text>
      {householdMembers.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Inga medlemmar.</Text>
      ) : (
        householdMembers.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <Text style={[styles.memberName, { color: colors.text }]}>
              {member.nickname}
            </Text>
            {isOwner && onAssign && !manualMemberIds.has(member.id) && (
              <Pressable
                accessibilityRole="button"
                disabled={isPending}
                accessibilityState={{ disabled: isPending, busy: isPending }}
                accessibilityLabel={`Tilldela sysslan till ${member.nickname}`}
                onPress={() => {
                  if (!isPending) onAssign({ taskId, memberId: member.id });
                }}
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
