import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import ScreenHeader from "@/components/ScreenHeader";
import TaskList from "@/components/TaskList";
import { HOUSEHOLD_ID } from "@/lib/api/client";
import { fetchHouseholdTasks } from "@/lib/api/tasks";
import { useTheme } from "@/theme";

export default function Index() {
  const { colors, scheme } = useTheme();
  const today = new Date();
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["tasks", HOUSEHOLD_ID],
    queryFn: () => fetchHouseholdTasks(HOUSEHOLD_ID),
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: scheme === "light" ? colors.surface : colors.background },
      ]}
    >
      <ScreenHeader />
      {isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>{error.message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Försök igen</Text>
          </Pressable>
        </View>
      ) : (
        <TaskList tasks={data} today={today} />
      )}

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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: { color: "#FFFFFF", fontWeight: "600" },
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
