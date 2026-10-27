import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ErrorView from "@/components/ErrorView";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import Avatar from "@/components/Avatar";
import TaskGroupDatePicker from "@/components/TaskGroupDatePicker";
import { createTaskGroup, updateTaskGroup } from "@/lib/api/task-groups";
import { householdQueryOptions } from "@/options/households";
import { taskGroupsQueryOptions } from "@/options/task-groups";
import { tasksQueryOptions } from "@/options/tasks";
import { useTheme } from "@/theme";
import {
  taskGroupBodySchema,
  type TaskGroupBody,
} from "@shared/schemas/task-group-schema";

export default function CreateTaskGroup() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const householdId = useActiveHouseholdId();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const household = useQuery(householdQueryOptions(householdId));
  const groups = useQuery(taskGroupsQueryOptions(householdId));
  const tasks = useQuery(tasksQueryOptions(householdId));
  const groupId = id ? Number(id) : undefined;
  const existing = groups.data?.find((group) => group.id === groupId);

  const [name, setName] = useState("");
  const [intervalDays, setIntervalDays] = useState("7");
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [taskIds, setTaskIds] = useState<number[]>([]);
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [prefilledId, setPrefilledId] = useState<number | null>(null);

  // Match the existing create-task form's prefill pattern.
  if (existing && tasks.data && prefilledId !== existing.id) {
    setPrefilledId(existing.id);
    setName(existing.name);
    setIntervalDays(String(existing.intervalDays));
    setStartDate(existing.startDate);
    setMemberIds(existing.memberIds);
    setTaskIds(existing.taskIds.filter(
      (taskId) => tasks.data.some((task) => task.id === taskId),
    ));
  }

  const saveMutation = useMutation({
    mutationFn: (body: TaskGroupBody) => {
      if (!householdId) throw new Error("Inget aktivt hushåll");
      return groupId === undefined
        ? createTaskGroup(householdId, body)
        : updateTaskGroup(householdId, groupId, body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["households", householdId],
      });
      router.back();
    },
  });

  const error = household.error ?? groups.error ?? tasks.error;
  if (household.isPending || groups.isPending || tasks.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }
  if (error) {
    return (
      <ErrorView
        error={error}
        retry={() => {
          void household.refetch();
          void groups.refetch();
          void tasks.refetch();
        }}
      />
    );
  }
  const isOwner = household.data?.members.some(
    (member) => member.isMe && member.isAdmin,
  );
  if (!isOwner || (id && !existing)) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>
          {!isOwner
            ? "Endast ägare kan hantera sysslegrupper."
            : "Gruppen hittades inte."}
        </Text>
      </View>
    );
  }

  const validation = taskGroupBodySchema.safeParse({
    name,
    intervalDays: Number(intervalDays),
    startDate,
    taskIds,
    memberIds,
  });
  const canSave = validation.success && !saveMutation.isPending;
  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={{ color: colors.text }}>Gruppnamn</Text>
        <TextInput
          accessibilityLabel="Gruppnamn"
          value={name}
          onChangeText={setName}
          placeholder="T.ex. Köket"
          placeholderTextColor={colors.textMuted}
          editable={!saveMutation.isPending}
          style={inputStyle}
        />
      </View>
      <View style={styles.field}>
        <Text style={{ color: colors.text }}>Byt medlem efter antal dagar</Text>
        <TextInput
          accessibilityLabel="Intervall i dagar"
          value={intervalDays}
          onChangeText={setIntervalDays}
          keyboardType="number-pad"
          editable={!saveMutation.isPending}
          style={inputStyle}
        />
      </View>
      <View style={styles.field}>
        <Text style={{ color: colors.text }}>Startdatum</Text>
        <TaskGroupDatePicker
          value={startDate}
          onChange={setStartDate}
          disabled={saveMutation.isPending}
        />
      </View>
      <Text style={{ color: colors.textMuted }}>
        Gruppen roterar mellan de deltagare du väljer. Pausade deltagare finns
        kvar i gruppen men hoppas över tills pausen avslutas. Manuella
        tilldelningar finns kvar.
      </Text>
      <Text
        accessibilityRole="header"
        style={[styles.heading, { color: colors.text }]}>
        Deltagare
      </Text>
      {household.data?.members.map((member) => {
        const selected = memberIds.includes(member.id);
        return (
          <Pressable
            key={member.id}
            accessibilityRole="checkbox"
            accessibilityLabel={`${member.nickname}${member.isPaused ? ", pausad" : ""}`}
            accessibilityState={{
              checked: selected,
              disabled: saveMutation.isPending,
            }}
            disabled={saveMutation.isPending}
            onPress={() => setMemberIds((previous) =>
              selected
                ? previous.filter((memberId) => memberId !== member.id)
                : [...previous, member.id],
            )}
            style={[styles.member, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.text }}>{selected ? "☑" : "☐"}</Text>
            <Avatar avatar={member.avatar} />
            <Text style={{ color: colors.text }}>
              {member.nickname}{member.isPaused ? " · Pausad" : ""}
            </Text>
          </Pressable>
        );
      })}
      <Text
        accessibilityRole="header"
        style={[styles.heading, { color: colors.text }]}>
        Sysslor
      </Text>
      {tasks.data?.length === 0 && (
        <Text style={{ color: colors.textMuted }}>
          Skapa en syssla innan du skapar en grupp.
        </Text>
      )}
      {tasks.data?.map((task) => {
        const selected = taskIds.includes(task.id);
        return (
          <Pressable
            key={task.id}
            accessibilityRole="checkbox"
            accessibilityLabel={task.name}
            accessibilityState={{
              checked: selected,
              disabled: saveMutation.isPending,
            }}
            disabled={saveMutation.isPending}
            onPress={() => setTaskIds((previous) =>
              selected
                ? previous.filter((taskId) => taskId !== task.id)
                : [...previous, task.id],
            )}
            style={[
              styles.task,
              { backgroundColor: colors.surface },
            ]}>
            <Text style={{ color: colors.text }}>
              {selected ? "☑" : "☐"} {task.name}
            </Text>
          </Pressable>
        );
      })}
      {saveMutation.error && (
        <Text accessibilityRole="alert" style={{ color: colors.text }}>
          {saveMutation.error.message}
        </Text>
      )}
      {!validation.success && (
        <Text style={{ color: colors.textMuted }}>
          Ange ett namn med minst två tecken, ett positivt heltal för intervallet,
          ett giltigt startdatum och välj minst en syssla och en deltagare.
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave, busy: saveMutation.isPending }}
        disabled={!canSave}
        onPress={() => {
          if (validation.success) saveMutation.mutate(validation.data);
        }}
        style={[
          styles.button,
          { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 },
        ]}>
        <Text style={{ ...styles.buttonText, color: colors.onPrimary }}>
          {saveMutation.isPending ? "Sparar…" : "Spara grupp"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={saveMutation.isPending}
        onPress={() => router.back()}
        style={styles.button}>
        <Text style={{ color: colors.text }}>Avbryt</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 16,
  },
  field: { gap: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  heading: { fontSize: 18, fontWeight: "600" },
  task: { padding: 14, borderRadius: 10, gap: 4 },
  member: {
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: { padding: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { fontWeight: "600" },
});
