import { FlatList, StyleSheet, Text } from "react-native";

import TaskCard from "@/components/TaskCard";
import { useTheme } from "@/theme";
import type { TaskListItem } from "@/types/task";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  tasks: TaskListItem[];
  today: Date;
}

export default function TaskList({ tasks, today }: Props): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <SafeAreaView>
      <FlatList
        data={tasks}
        keyExtractor={(task) => String(task.id)}
        renderItem={({ item }) => <TaskCard task={item} today={today} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={[styles.heading, { color: colors.text }]}>Sysslor</Text>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Inga sysslor än
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 112,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: { fontSize: 16, textAlign: "center", marginTop: 32 },
});
