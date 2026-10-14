import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import { TaskList } from "@/components/TaskList";
import { exampleTasks } from "@/data/exampleTasks";
import { useTheme } from "@/theme";

export default function Index() {
  const { colors, scheme } = useTheme();
  const today = new Date();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: scheme === "light" ? colors.surface : colors.background },
      ]}
    >
      <TaskList tasks={exampleTasks} today={today} />

      <Link href="/create-task" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skapa syssla"
          style={StyleSheet.flatten([
            styles.addButton,
            { backgroundColor: colors.primary },
          ])}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButton: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
  },
});
