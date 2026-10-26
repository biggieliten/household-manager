import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import Avatar from "@/components/Avatar";

import type { TaskListItem } from "@shared/schemas/task-schema";

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
  const { colors } = useTheme();
  // `today` can be a past day, so ignore completions made after it
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );
  const completions = task.completedTasks.filter(
    ({ completedAt }) => completedAt < endOfDay,
  );
  const latestCompletion = completions[0];
  const elapsed = latestCompletion
    ? daysSince(latestCompletion.completedAt, today)
    : null;
  const completedToday = completions.filter(
    ({ completedAt }) => completedAt.toDateString() === today.toDateString(),
  );
  const members = [
    ...new Map(
      completedToday.map(({ member }) => [member.id, member]),
    ).values(),
  ];
  const doneToday = elapsed === 0;
  const overdue = elapsed !== null && elapsed > task.frequency;
  const status = doneToday
    ? "Gjord idag"
    : overdue
      ? "Försenad"
      : "Inte gjord idag";
  const statusBackground = doneToday
    ? "#51FAC1"
    : overdue
      ? "#FFDDDA"
      : colors.chip;

  return (
    <Link href={{ pathname: "/[id]", params: { id: String(task.id) } }}>
      <View
        accessible
        accessibilityLabel={`${task.name}, ${status}, ${
          elapsed === null
            ? "aldrig gjord"
            : `${elapsed} dagar sedan senast gjord`
        }${members.length ? `, gjord av ${members.map((member) => member.nickname).join(", ")}` : ""}`}
        style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[styles.taskName, { color: colors.text }]}>
              {task.name}
            </Text>
            <View style={[styles.label, { backgroundColor: colors.chip }]}>
              <Text style={[styles.labelText, { color: colors.text }]}>
                {`⚡ ${task.difficultyLevel}p`}
              </Text>
            </View>
          </View>
        </View>

        {doneToday ? (
          <View style={styles.avatars}>
            {members.map((member) => (
              <Avatar key={member.id} avatar={member.avatar} />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.daysBadge,
              { backgroundColor: overdue ? "#FF6B6B" : statusBackground },
            ]}>
            <Text
              style={[
                styles.daysText,
                { color: overdue ? "#6D0010" : colors.text },
              ]}>
              {elapsed === null ? "Inte gjord än" : `${elapsed} d`}
            </Text>
          </View>
        )}
      </View>
    </Link>
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
  cardContent: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskName: { fontSize: 19, fontWeight: "600", flexShrink: 1 },
  label: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  labelText: { fontSize: 12, fontWeight: "700" },
  avatars: { flexDirection: "row", flexWrap: "wrap", gap: 4, maxWidth: 148 },
  daysBadge: { borderRadius: 18, paddingHorizontal: 9, paddingVertical: 6 },
  daysText: { fontSize: 13, fontWeight: "700" },
});
