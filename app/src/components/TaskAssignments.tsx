import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import type { Member } from "@shared/schemas/member-schema";
import type { MemberToTask } from "@shared/schemas/member-to-task-schema";

type Props = {
  taskId: number;
  assignments: readonly MemberToTask[];
  members: readonly (Pick<Member, "id" | "nickname" | "leftAt"> & {
    isPaused: boolean;
  })[];
};

export default function TaskAssignments({ taskId, assignments, members }: Props) {
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
            <Text key={memberId} style={{ color: colors.text }}>
              {member?.nickname ?? `Medlem #${memberId}`}
              {member?.isPaused ? " · Pausad" : ""}
            </Text>
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
          <Text key={member.id} style={{ color: colors.text }}>
            {member.nickname}
          </Text>
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
});

// TODO(#51): Låt hushållets ägare välja medlemmar och ta bort tilldelningar.
// TODO(#51): Koppla medlemsvalen till API-anropen för tilldelningar.
// TODO(#51): Visa laddning och fel inline samt hindra upprepade ändringar medan sparande pågår.
// TODO(#51): Uppdatera visade tilldelningar efter att servern har bekräftat ändringen.
// TODO(#51): Följ befintligt tema och verifiera tillgänglighet på mobil.
