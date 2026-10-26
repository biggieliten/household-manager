import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import LoadingView from "@/components/LoadingView";
import ScreenHeader from "@/components/ScreenHeader";
import TaskList from "@/components/TaskList";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { householdsQueryOptions } from "@/options/households";
import {
  taskAssignmentsQueryOptions,
  tasksQueryOptions,
} from "@/options/tasks";
import { useTheme } from "@/theme";

export default function Index() {
  const { colors } = useTheme();
  const today = new Date();
  const householdId = useActiveHouseholdId();
  const {
    data: tasks,
    isPending,
    error,
    refetch,
  } = useQuery(tasksQueryOptions(householdId));
  const households = useQuery(householdsQueryOptions);
  const assignments = useQuery(taskAssignmentsQueryOptions(householdId));
  const member = households.data?.find(
    (household) => household.id === householdId,
  )?.member;
  const memberId = member?.id;
  const isPaused = member?.isPaused ?? false;

  return (
    <View
      // edges={["top"]}
      style={[styles.container, { backgroundColor: colors.screen }]}>
      <ScreenHeader />
      {isPaused && (
        <View
          style={[styles.pausedBanner, { backgroundColor: colors.warning }]}>
          <Feather name="pause-circle" size={28} color={colors.warningText} />
          <View style={styles.pausedTextBox}>
            <Text style={[styles.pausedTitle, { color: colors.warningText }]}>
              Du är pausad
            </Text>
            <Text
              style={[styles.pausedSubtitle, { color: colors.warningText }]}>
              Du kan inte utföra sysslor just nu
            </Text>
          </View>
        </View>
      )}

      {isPending ? (
        <LoadingView />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>{error.message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryButtonText}>Försök igen</Text>
          </Pressable>
        </View>
      ) : (
        tasks && (
          <TaskList
            tasks={tasks}
            today={today}
            memberId={memberId}
            assignments={assignments.data ?? []}
            isPaused={isPaused}
          />
        )
      )}

      <Link href="/create-task" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skapa syssla"
          style={StyleSheet.flatten([
            styles.addButton,
            { backgroundColor: colors.primary },
          ])}>
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
    bottom: 80,
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
  pausedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  pausedTextBox: { flex: 1 },
  pausedTitle: { fontSize: 18, fontWeight: "700" },
  pausedSubtitle: { fontSize: 14 },
});
