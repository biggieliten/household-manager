import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import PausedInfoModal from "@/components/PausedInfoModal";

import Avatar from "@/components/Avatar";
import DeleteTaskModal from "@/components/DeleteTaskModal";
import ErrorView from "@/components/ErrorView";
import LoadingView from "@/components/LoadingView";
import TaskAssignments from "@/components/TaskAssignments";
import TaskImageRow from "@/components/TaskImageRow";
import VoiceNoteRow from "@/components/VoiceNoteRow";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { assignTask, removeTaskAssignment } from "@/lib/api/task-assignments";
import {
  archiveTask,
  completeTask,
  deleteTask,
  taskMediaUrl,
} from "@/lib/api/tasks";
import { authHeadersQueryOptions } from "@/options/auth";
import { householdQueryOptions } from "@/options/households";
import {
  taskAssignmentsQueryOptions,
  tasksQueryOptions,
} from "@/options/tasks";
import { useTheme } from "@/theme";
import type { MemberToTask } from "@shared/schemas/member-to-task-schema";
import { useState } from "react";
import { toast } from "sonner-native";

function difficultyLabel(level: number): string {
  if (level <= 1) return "Lätt";
  if (level <= 3) return "Normal";
  if (level <= 5) return "Medeltung";
  if (level <= 7) return "Tung";
  return "Mycket tung";
}

function frequencyLabel(frequency: number): string {
  if (frequency === 0) return "Återkommer inte";
  if (frequency === 1) return "Varje dag";
  return `Var ${frequency}:e dag`;
}

function daysSince(date: Date, today: Date): number {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function daysAgoLabel(days: number): string {
  if (days === 0) return "Idag";
  if (days === 1) return "Igår";
  return `${days} dagar sedan`;
}

export default function TaskById() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteStep, setDeleteStep] = useState<"closed" | "choose" | "confirm">(
    "closed",
  );
  const [showPausedInfo, setShowPausedInfo] = useState(false);

  const { colors } = useTheme();
  const householdId = useActiveHouseholdId();
  const {
    data: tasks,
    error,
    isPending,
    refetch,
  } = useQuery(tasksQueryOptions(householdId));

  const task = tasks?.find((task) => task.id === Number(id));

  const archiveMutation = useMutation({
    mutationFn: (taskId: number) => archiveTask(Number(householdId), taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tasksQueryOptions(householdId).queryKey,
      });
      toast.success(`${task?.name} arkiverad`);
      setTimeout(() => router.back(), 100);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleArchive = () => {
    Alert.alert(
      `Akrivera ${task?.name}`,
      "Är du säker på att du vill arkivera sysslan?",
      [
        { text: "Avbryt", style: "cancel" },
        { text: "Arkivera", style: "destructive", onPress: () => archive() },
      ],
      { cancelable: true },
    );
  };

  const archive = () => {
    if (task) {
      archiveMutation.mutate(task.id);
    }
  };

  const handleCompleteTask = (id: number) => {
    if (!completeTaskMutation.isError) {
      completeTaskMutation.mutate(id);
      router.push("/");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => {
      if (!householdId) throw new Error("Inget aktivt hushåll");
      return deleteTask(householdId, taskId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tasksQueryOptions(householdId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ["households", householdId, "statistics"],
        }),
      ]);
      router.replace("/");
    },
  });

  const householdQuery = useQuery(householdQueryOptions(householdId));
  const isOwner =
    householdQuery.data?.members.some(
      (member) => member.isMe && member.isAdmin,
    ) ?? false;

  const isPaused =
    householdQuery.data?.members.some(
      (member) => member.isMe && member.isPaused,
    ) ?? false;

  const assignmentsKey = taskAssignmentsQueryOptions(householdId).queryKey;
  const assignmentsQuery = useQuery(taskAssignmentsQueryOptions(householdId));
  const assignmentMutation = useMutation({
    mutationFn: ({
      assignment,
      remove,
    }: {
      assignment: MemberToTask;
      remove: boolean;
    }) => {
      if (!householdId) throw new Error("Inget aktivt hushåll");
      return remove
        ? removeTaskAssignment(householdId, assignment)
        : assignTask(householdId, assignment);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: assignmentsKey }),
        queryClient.invalidateQueries({
          queryKey: tasksQueryOptions(householdId).queryKey,
        }),
      ]);
    },
  });
  const assignmentError = householdQuery.error ?? assignmentsQuery.error;

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) => {
      if (!householdId) throw new Error("Inget aktivt hushåll");
      return completeTask(householdId, taskId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tasksQueryOptions(householdId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ["households", householdId, "statistics"],
        }),
      ]);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  // Media is only shown here; it is changed in the edit task view
  const { data: authHeaders } = useQuery(authHeadersQueryOptions);

  const history = task?.completedTasks
    .filter(
      (completion, index, all) =>
        all.findIndex((other) => other.member.id === completion.member.id) ===
        index,
    )
    .map((completion) => ({
      ...completion,
      count: task.completedTasks.filter(
        (other) => other.member.id === completion.member.id,
      ).length,
    }));

  const count = task?.completedTasks.length ?? 0;

  console.log({ count });

  const cardStyle = [styles.card, { backgroundColor: colors.card }];

  if (isPending) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.screen }]}>
        <LoadingView />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.screen }}>
        <ErrorView error={error} retry={() => refetch()} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.screen }]}>
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
          Sysslan hittades inte
        </Text>
      </View>
    );
  }

  const latestCompletion = task.completedTasks[0];
  const lastDone = latestCompletion
    ? daysAgoLabel(daysSince(latestCompletion.completedAt, new Date()))
    : "Aldrig gjord";
  const doneToday = latestCompletion
    ? daysSince(latestCompletion.completedAt, new Date()) === 0
    : false;

  const totalThisYear = task.completedTasks.filter(
    (ct) => ct.completedAt.getUTCFullYear() === new Date().getUTCFullYear(),
  ).length;
  const image = task.media.find((media) => media.kind === "image");
  const audio = task.media.find((media) => media.kind === "audio");

  return (
    <ScrollView
      style={{ backgroundColor: colors.screen }}
      contentContainerStyle={styles.content}>
      {(householdQuery.isPending || assignmentsQuery.isPending) && (
        <ActivityIndicator color={colors.textMuted} />
      )}
      {assignmentError && (
        <ErrorView
          error={assignmentError}
          retry={() => {
            void householdQuery.refetch();
            void assignmentsQuery.refetch();
          }}
        />
      )}
      {householdQuery.data && assignmentsQuery.data && (
        <TaskAssignments
          taskId={task.id}
          assignments={assignmentsQuery.data}
          members={householdQuery.data.members.map((member) => ({
            ...member,
            leftAt: null,
          }))}
          isOwner={householdQuery.data.members.some(
            (member: { isMe: boolean; isAdmin: boolean }) =>
              member.isMe && member.isAdmin,
          )}
          isPending={
            assignmentMutation.isPending ||
            assignmentsQuery.isFetching ||
            householdQuery.isFetching
          }
          error={assignmentMutation.error?.message}
          onAssign={(assignment) => {
            if (!assignmentMutation.isPending)
              assignmentMutation.mutate({ assignment, remove: false });
          }}
          onRemove={(assignment) => {
            if (!assignmentMutation.isPending)
              assignmentMutation.mutate({ assignment, remove: true });
          }}
        />
      )}
      <View style={cardStyle}>
        <Text style={[styles.title, { color: colors.text }]}>{task.name}</Text>

        <View style={styles.statsRow}>
          <Text style={[styles.stat, { color: colors.textMuted }]}>
            <Text style={{ color: colors.danger }}>⚡</Text>{" "}
            {task.difficultyLevel} p ({difficultyLabel(task.difficultyLevel)})
          </Text>
          <Text style={[styles.stat, { color: colors.textMuted }]}>
            {frequencyLabel(task.frequency)}
          </Text>
        </View>
      </View>

      <View style={cardStyle}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Instruktioner
          </Text>
        </View>

        {householdId && authHeaders && audio && (
          <VoiceNoteRow
            source={{
              uri: taskMediaUrl(householdId, task.id, audio),
              headers: authHeaders,
            }}
          />
        )}

        {householdId && authHeaders && image && (
          <TaskImageRow
            source={{
              uri: taskMediaUrl(householdId, task.id, image),
              headers: authHeaders,
            }}
            openable
          />
        )}

        <View style={[styles.tile, { backgroundColor: colors.taskTile }]}>
          <View style={styles.tileContent}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>
              Beskrivning
            </Text>
            <Text style={[styles.tileBody, { color: colors.text }]}>
              {task.description}
            </Text>
          </View>
        </View>
      </View>

      <View style={cardStyle}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Historik
          </Text>
          <Text style={[styles.historyTotal, { color: colors.text }]}>
            {history && history.length > 0
              ? `${totalThisYear} ggr i år`
              : "Inga utföranden ännu"}
          </Text>
        </View>

        {history &&
          history.map((entry, index) => (
            <View key={entry.member.id} style={styles.historyRow}>
              <Avatar avatar={entry.member.avatar} size={40} />
              <View style={styles.tileContent}>
                <Text style={[styles.historyName, { color: colors.text }]}>
                  {entry.member.nickname}
                  {index === 0 && (
                    <Text
                      style={{ color: colors.textMuted, fontWeight: "400" }}>
                      {" "}
                      · Senast
                    </Text>
                  )}
                </Text>

                <Text style={[styles.tileBody, { color: colors.text }]}>
                  {daysAgoLabel(daysSince(entry.completedAt, new Date()))}
                </Text>
              </View>

              <Text style={[styles.historyCount, { color: colors.text }]}>
                {entry.count} ggr
              </Text>
            </View>
          ))}
      </View>

      {isPaused ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Du är pausad, visa mer information"
          onPress={() => setShowPausedInfo(true)}
          style={({ pressed }) => [
            styles.doneButton,
            {
              backgroundColor: colors.warning,
              opacity: pressed ? 0.8 : 1,
            },
          ]}>
          <Feather name="pause-circle" size={20} color={colors.warningText} />
          <Text style={[{ ...styles.doneButtonText, color: colors.onPrimary }, { color: colors.warningText }]}>
            Du är pausad
          </Text>
        </Pressable>
      ) : !doneToday ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Markera som klar, ${task.difficultyLevel} poäng`}
          accessibilityState={{
            disabled: !householdId || completeTaskMutation.isPending,
          }}
          disabled={!householdId || completeTaskMutation.isPending}
          onPress={() => handleCompleteTask(task.id)}
          style={({ pressed }) => [
            styles.doneButton,
            {
              backgroundColor: colors.danger,
              opacity: completeTaskMutation.isPending ? 0.5 : pressed ? 0.8 : 1,
            },
          ]}>
          <Text style={{ ...styles.doneButtonText, color: colors.onPrimary }}>
            {completeTaskMutation.isPending ? "Sparar…" : "✓ Markera som klar"}
          </Text>
          <View style={{ ...styles.doneBadge, backgroundColor: colors.badgeOverlay }}>
            <Text style={{ ...styles.doneBadgeText, color: colors.onPrimary }}>+{task.difficultyLevel}p</Text>
          </View>
        </Pressable>
      ) : null}

      {completeTaskMutation.isError && (
        <Text style={{ color: colors.taskDangerText }}>
          {completeTaskMutation.error.message}
        </Text>
      )}
      {completeTaskMutation.isSuccess && (
        <Text style={{ color: colors.primary }}>
          Sysslan är markerad som klar
        </Text>
      )}
      {isOwner && (
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Redigera inställningar"
            onPress={() =>
              router.push({
                pathname: "/create-task",
                params: { id: String(task.id) },
              })
            }
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: colors.taskChip, opacity: pressed ? 0.8 : 1 },
            ]}>
            <SymbolView
              name={{ ios: "pencil", android: "edit", web: "edit" }}
              size={20}
              tintColor={colors.text}
              fallback={<Text>✏️</Text>}
            />
            <Text style={[styles.editButtonText, { color: colors.text }]}>
              Redigera syssla
            </Text>
          </Pressable>
        </View>
      )}
      {isOwner && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setDeleteStep("choose")}
          style={styles.textButton}>
          <Text style={[styles.deleteText, { color: colors.taskDangerText }]}>
            Ta bort syssla
          </Text>
        </Pressable>
      )}
      {isOwner && deleteStep !== "closed" && (
        <DeleteTaskModal
          step={deleteStep}
          dangerColor={colors.danger}
          isPending={deleteMutation.isPending || archiveMutation.isPending}
          error={
            deleteMutation.error?.message ?? archiveMutation.error?.message
          }
          onArchive={handleArchive}
          onChooseDelete={() => setDeleteStep("confirm")}
          onConfirmDelete={() => deleteMutation.mutate(task.id)}
          onCancel={() => setDeleteStep("closed")}
        />
      )}
      {showPausedInfo && (
        <PausedInfoModal onClose={() => setShowPausedInfo(false)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  metaChipText: { fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 20, padding: 20, gap: 14 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 13, fontWeight: "700" },
  categoryIcon: { fontSize: 26 },
  title: { fontSize: 28, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 20 },
  stat: { fontSize: 15 },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 4,
  },
  doneButtonText: {  fontSize: 17, fontWeight: "600" },
  doneBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadgeText: {  fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  iconRow: { flexDirection: "row", gap: 16 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 12,
  },
  tileContent: { flex: 1, gap: 2 },
  tileTitle: { fontSize: 15, fontWeight: "600" },
  tileBody: { fontSize: 15 },
  historyTotal: { fontSize: 13, fontWeight: "600" },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  historyName: { fontSize: 14, fontWeight: "600" },
  historyCount: { fontSize: 14, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 12 },
  editButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 8,
  },
  editButtonText: { fontSize: 17, fontWeight: "500" },
  shareButton: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  textButton: { alignItems: "center", paddingVertical: 6 },
  archiveText: { fontSize: 15, fontWeight: "500" },
  deleteText: { fontSize: 13, fontWeight: "500" },
});
