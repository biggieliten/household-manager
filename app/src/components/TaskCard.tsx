import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import type { Avatar, TaskListItem } from "@/types/task";

const avatarEmoji: Record<Avatar, string> = {
  FOX: "🦊",
  PIG: "🐷",
  FROG: "🐸",
  CHICKEN: "🐥",
  OCTOPUS: "🐙",
  DOLPHIN: "🐬",
  OWL: "🦉",
  UNICORN: "🦄",
};

function daysSince(completedAt: Date, today: Date): number {
  const completedDay = Date.UTC(
    completedAt.getFullYear(),
    completedAt.getMonth(),
    completedAt.getDate(),
  );
  const currentDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.max(0, Math.round((currentDay - completedDay) / 86_400_000));
}

interface Props {
  task: TaskListItem;
  today: Date;
}

export default function TaskCard({ task, today }: Props): React.JSX.Element {
  const { colors, scheme } = useTheme();
  const latestCompletion = task.completedTasks[0];
  const elapsed = latestCompletion
    ? daysSince(latestCompletion.completedAt, today)
    : null;
  const completedToday = task.completedTasks.filter(
    ({ completedAt }) => completedAt.toDateString() === today.toDateString(),
  );
  const members = [...new Map(
    completedToday.map(({ member }) => [member.id, member]),
  ).values()];
  const doneToday = elapsed === 0;
  const overdue = elapsed !== null && elapsed > task.frequency;
  const status = doneToday
    ? "Gjord idag"
    : overdue
      ? "Försenad"
      : "Inte gjord idag";
  const cardBackground =
    scheme === "light" ? colors.background : colors.surface;
  const statusBackground = doneToday
    ? "#51FAC1"
    : overdue
      ? "#FFDDDA"
      : scheme === "light"
        ? "#ECEBFD"
        : "#33354A";
  const statusColor = doneToday
    ? "#00513B"
    : overdue
      ? "#B42318"
      : colors.textMuted;

  return (
    <View
      accessible
      accessibilityLabel={`${task.name}, ${status}, ${
        elapsed === null
          ? "aldrig gjord"
          : `${elapsed} dagar sedan senast gjord`
      }${members.length ? `, gjord av ${members.map((member) => member.nickname).join(", ")}` : ""}`}
      style={[styles.card, { backgroundColor: cardBackground }]}
    >
      <View
        style={[styles.statusCircle, { backgroundColor: statusBackground }]}
      >
        <Text style={[styles.statusIcon, { color: statusColor }]}>
          {overdue ? "!" : "✓"}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={[styles.taskName, { color: colors.text }]}
          >
            {task.name}
          </Text>
          <View
            style={[
              styles.label,
              {
                backgroundColor: scheme === "light" ? "#ECEBFD" : "#33354A",
              },
            ]}
          >
            <Text
              style={[styles.labelText, { color: colors.text }]}
            >
              {`⚡ ${task.difficultyLevel}p`}
            </Text>
          </View>
        </View>
      </View>

      {doneToday ? (
        <View style={styles.avatars}>
          {members.map((member) => (
            <View
              key={member.id}
              style={[styles.avatar, { backgroundColor: statusBackground }]}
            >
              <Text style={styles.avatarEmoji}>{avatarEmoji[member.avatar]}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.daysBadge,
            { backgroundColor: overdue ? "#FF6B6B" : statusBackground },
          ]}
        >
          <Text
            style={[
              styles.daysText,
              { color: overdue ? "#6D0010" : colors.text },
            ]}
          >
            {elapsed === null ? "Inte gjord än" : `${elapsed} d`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    padding: 14,
  },
  statusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIcon: { fontSize: 26, fontWeight: "600" },
  cardContent: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskName: { fontSize: 19, fontWeight: "600", flexShrink: 1 },
  label: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  labelText: { fontSize: 12, fontWeight: "700" },
  avatars: { flexDirection: "row", flexWrap: "wrap", gap: 4, maxWidth: 148 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 21 },
  daysBadge: { borderRadius: 18, paddingHorizontal: 9, paddingVertical: 6 },
  daysText: { fontSize: 13, fontWeight: "700" },
});
