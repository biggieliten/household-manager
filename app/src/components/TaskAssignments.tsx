import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import TaskAssignmentBadges from "@/components/TaskAssignmentBadges";
import TaskMemberPicker from "@/components/TaskMemberPicker";
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
  members: readonly (Pick<Member, "id" | "nickname" | "avatar" | "leftAt"> & {
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
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
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
  const selectedAssignment = taskAssignments.find(
    (assignment) => assignment.memberId === selectedMemberId,
  );
  const selectedMember = selectedAssignment
    ? membersById.get(selectedAssignment.memberId)
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {isPending && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.textMuted }}>
          Sparar…
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.text }}>
          {error}
        </Text>
      )}
      <Text
        accessibilityRole="header"
        style={[styles.heading, { color: colors.text }]}>
        Tilldelade medlemmar
      </Text>
      <View style={styles.avatarRow}>
        {taskAssignments.map(({ memberId, isManual, groups }) => {
          const member = membersById.get(memberId);
          const label = [
            member?.nickname ?? `Medlem #${memberId}`,
            member?.isPaused ? "pausad" : "",
            isManual ? "manuellt tilldelad" : "",
            ...groups.map((group) => group.name),
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <Pressable
              key={memberId}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityHint="Visar var tilldelningen kommer ifrån"
              accessibilityState={{ expanded: selectedMemberId === memberId }}
              onPress={() =>
                setSelectedMemberId((previous) =>
                  previous === memberId ? null : memberId,
                )
              }
              style={({ pressed }) => [
                styles.assignedMember,
                (member?.isPaused || pressed) && styles.paused,
              ]}>
              {member ? (
                <Avatar avatar={member.avatar} />
              ) : (
                <Text style={{ color: colors.text }}>?</Text>
              )}
              <TaskAssignmentBadges
                isManual={isManual}
                hasGroups={groups.length > 0}
              />
            </Pressable>
          );
        })}
        {isOwner && onAssign && onRemove && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              memberPickerOpen
                ? "Stäng medlemsval"
                : "Ändra tilldelade medlemmar"
            }
            accessibilityState={{ expanded: memberPickerOpen }}
            onPress={() => setMemberPickerOpen((open) => !open)}
            style={[styles.action, { borderColor: colors.border }]}>
            <Text style={[styles.toggle, { color: colors.primary }]}>
              {memberPickerOpen ? "−" : "+"}
            </Text>
          </Pressable>
        )}
      </View>
      {selectedAssignment && (
        <View style={[styles.details, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.text }}>
            {selectedMember?.nickname ??
              `Medlem #${selectedAssignment.memberId}`}
            {selectedMember?.isPaused ? " · Pausad" : ""}
          </Text>
          {selectedAssignment.isManual && (
            <View style={styles.sourceRow}>
              <Feather name="user" size={14} color={colors.textMuted} />
              <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                Direkt tilldelad
              </Text>
            </View>
          )}
          {selectedAssignment.groups.map((group) => (
            <View key={group.id} style={styles.sourceRow}>
              <Feather name="repeat" size={14} color={colors.textMuted} />
              <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                Roterar via {group.name}
              </Text>
            </View>
          ))}
        </View>
      )}
      {isOwner && memberPickerOpen && onAssign && onRemove && (
        <TaskMemberPicker
          members={householdMembers}
          selectedMemberIds={manualMemberIds}
          isPending={isPending}
          onToggle={(memberId) => {
            const assignment = { taskId, memberId };
            if (manualMemberIds.has(memberId)) onRemove(assignment);
            else onAssign(assignment);
          }}
        />
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
  avatarRow: {
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
  assignedMember: {
    minHeight: 48,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourceText: {
    flex: 1,
  },
  toggle: {
    fontSize: 26,
  },
  paused: {
    opacity: 0.4,
  },
});
