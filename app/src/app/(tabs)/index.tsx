import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ErrorView from "@/components/ErrorView";
import LoadingView from "@/components/LoadingView";
import ScreenHeader from "@/components/ScreenHeader";
import TaskList from "@/components/TaskList";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { householdsQueryOptions } from "@/options/households";
import { taskAssignmentsQueryOptions, tasksQueryOptions } from "@/options/tasks";
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
  const memberId = households.data?.find(
    (household) => household.id === householdId,
  )?.member.id;

  return (
    <View
      // edges={["top"]}
      style={[styles.container, { backgroundColor: colors.screen }]}>
      <ScreenHeader />
      {isPending ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error.message} retry={() => refetch()} />
      ) : (
        tasks && (
          <TaskList
            tasks={tasks}
            today={today}
            memberId={memberId}
            assignments={assignments.data ?? []}
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
});
