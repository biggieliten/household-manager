import { useState } from "react";
import { FlatList, StyleSheet, Switch, Text, View } from "react-native";

import TaskCard from "@/components/TaskCard";
import { useTheme } from "@/theme";
import type { MemberToTask } from "@shared/schemas/member-to-task-schema";
import type { TaskListItem } from "@shared/schemas/task-schema";

interface Props {
  tasks: TaskListItem[];
  today: Date;
  memberId: number | undefined;
  assignments: MemberToTask[];
  isPaused: boolean;
}

export default function TaskList({
  tasks,
  today,
  memberId,
  assignments,
  isPaused,
}: Props): React.JSX.Element {
  const { colors } = useTheme();
  const [onlyMine, setOnlyMine] = useState(true);
  const visibleTasks = onlyMine
    ? tasks.filter((task) =>
        assignments.some(
          (assignment) =>
            assignment.taskId === task.id && assignment.memberId === memberId,
        ),
      )
    : tasks;

  return (
    <FlatList
      data={visibleTasks}
      keyExtractor={(task) => String(task.id)}
      renderItem={({ item }) => (
        <View style={isPaused && styles.pausedCard}>
          <TaskCard task={item} today={today} />
        </View>
      )}

      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Sysslor</Text>
          <View style={styles.filter}>
            <Text style={{ color: colors.text }}>Mina sysslor</Text>
            <Switch
              accessibilityLabel="Mina sysslor"
              value={onlyMine}
              onValueChange={setOnlyMine}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.onPrimary}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {onlyMine ? "Inga tilldelade sysslor" : "Inga sysslor än"}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 112,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filter: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: {
    fontSize: 24,
    fontWeight: "700",
  },
  emptyText: { fontSize: 16, textAlign: "center", marginTop: 32 },
  pausedCard: { opacity: 0.5 },
});
