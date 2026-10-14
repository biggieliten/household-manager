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
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((currentDay - completedDay) / 86_400_000));
}

export function TaskCard({
  task,
  today,
}: {
  task: TaskListItem;
  today: Date;
}): React.JSX.Element {
  const { colors, scheme } = useTheme();
  const elapsed = task.latestCompletion
    ? daysSince(task.latestCompletion.completedAt, today)
    : null;
  const doneToday = elapsed === 0;
  const overdue = elapsed !== null && elapsed > task.frequency;
  const status = doneToday ? "Gjord idag" : overdue ? "Försenad" : "Inte gjord idag";
  const cardBackground = scheme === "light" ? colors.background : colors.surface;
  const statusBackground = doneToday
    ? "#51FAC1"
    : overdue
      ? "#FFDDDA"
      : scheme === "light"
        ? "#ECEBFD"
        : "#33354A";
  const statusColor = doneToday ? "#00513B" : overdue ? "#B42318" : colors.textMuted;

  return (
    <View
      accessible
      accessibilityLabel={`${task.name}, ${task.description}, ${status}, ${
        elapsed === null ? "aldrig gjord" : `${elapsed} dagar sedan senast gjord`
      }`}
      style={[styles.card, { backgroundColor: cardBackground }]}
    >
      <View style={[styles.statusCircle, { backgroundColor: statusBackground }]}>
        <Text style={[styles.statusIcon, { color: statusColor }]}>
          {overdue ? "!" : "✓"}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.taskName, { color: colors.text }]}>
            {task.name}
          </Text>
          <View
            style={[
              styles.label,
              { backgroundColor: overdue ? "#FFDDDA" : scheme === "light" ? "#ECEBFD" : "#33354A" },
            ]}
          >
            <Text style={[styles.labelText, { color: overdue ? "#B42318" : colors.text }]}>
              {overdue ? "Försenad" : `⚡ ${task.difficultyLevel}p`}
            </Text>
          </View>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.description, { color: overdue ? "#B42318" : colors.textMuted }]}
        >
          {task.description}
        </Text>
      </View>

      {doneToday && task.latestCompletion ? (
        <View style={[styles.avatar, { backgroundColor: statusBackground }]}>
          <Text style={styles.avatarEmoji}>
            {avatarEmoji[task.latestCompletion.member.avatar]}
          </Text>
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
  cardContent: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskName: { fontSize: 19, fontWeight: "600", flexShrink: 1 },
  label: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  labelText: { fontSize: 12, fontWeight: "700" },
  description: { fontSize: 14 },
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
