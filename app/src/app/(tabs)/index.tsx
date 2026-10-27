import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import PausedInfoModal from "@/components/PausedInfoModal";

import DateCarousel from "@/components/DateCarousel";
import ErrorView from "@/components/ErrorView";
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

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function Index() {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(startOfToday);
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
  const [showPausedInfo, setShowPausedInfo] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.screen }]}>
      <ScreenHeader />
      {isPaused && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Du är pausad, visa mer information"
          onPress={() => setShowPausedInfo(true)}
          style={({ pressed }) => [
            styles.pausedBanner,
            { backgroundColor: colors.warning, opacity: pressed ? 0.8 : 1 },
          ]}>
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
          <Feather name="info" size={20} color={colors.warningText} />
        </Pressable>
      )}

      {isPending ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} retry={() => refetch()} />
      ) : (
        tasks && (
          <>
            <DateCarousel
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <TaskList
              tasks={tasks}
              today={selectedDate}
              memberId={memberId}
              assignments={assignments.data ?? []}
              isPaused={isPaused}
            />
          </>
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
          <Text style={{ ...styles.addButtonText, color: colors.onPrimary }}>
            +
          </Text>
        </Pressable>
      </Link>
      {showPausedInfo && (
        <PausedInfoModal onClose={() => setShowPausedInfo(false)} />
      )}
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
