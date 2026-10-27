import { StyleSheet, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import MemberMenu from "@/components/MemberMenu";
import { useTheme } from "@/theme";
import type { Avatar as AvatarType } from "@shared/schemas/member-schema";
import type { TaskGroup } from "@shared/schemas/task-group-schema";

type GroupMember = {
  id: number;
  nickname: string;
  avatar: AvatarType;
  isPaused: boolean;
};

type Props = {
  group: TaskGroup;
  members: GroupMember[];
  isOwner: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function TaskGroupCard({
  group,
  members,
  isOwner,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  const participants = members.filter(
    (member) => group.memberIds.includes(member.id),
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
        {group.name}
      </Text>
      <View style={styles.participants}>
        {participants.map((member) => {
          const isResponsible = member.id === group.currentMemberId;
          let accessibilityLabel = member.nickname;
          if (member.isPaused) accessibilityLabel += ", pausad";
          if (isResponsible) accessibilityLabel += ", ansvarig nu";

          return (
            <View
              key={member.id}
              accessible
              accessibilityLabel={accessibilityLabel}
              style={[
                styles.participant,
                { borderColor: isResponsible ? colors.primary : colors.transparent },
                member.isPaused && styles.paused,
              ]}>
              <Avatar avatar={member.avatar} size={26} />
            </View>
          );
        })}
      </View>
      {isOwner && (
        <MemberMenu
          open={menuOpen}
          onToggle={onToggleMenu}
          items={[
            { label: "Redigera", onPress: onEdit },
            { label: "Ta bort", onPress: onDelete },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    padding: 12,
  },
  name: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: "600" },
  participants: {
    flexDirection: "row",
    flexWrap: "wrap",
    flexShrink: 1,
    maxWidth: "50%",
    gap: 4,
  },
  participant: { padding: 2, borderRadius: 18, borderWidth: 2 },
  paused: { opacity: 0.4 },
});
