import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import TaskMemberPicker from "@/components/TaskMemberPicker";
import useActiveHouseholdId from "@/hooks/use-active-household-id";
import { assignTask } from "@/lib/api/task-assignments";
import { createTask, updateTask } from "@/lib/api/tasks";
import { householdQueryOptions } from "@/options/households";
import {
  taskAssignmentsQueryOptions,
  taskQueryOptions,
  tasksQueryOptions,
} from "@/options/tasks";
import { useTheme } from "@/theme";
import type { CreateTaskBody } from "@shared/schemas/task-schema";
import { createTaskBodySchema } from "@shared/schemas/task-schema";
import { useToast } from "react-native-toastify-expo";

const frequencyOptions = Array.from({ length: 31 }, (_, i) => i);
const difficultyOptions = [
  { value: 1, label: "Lätt" },
  { value: 2, label: "Normal" },
  { value: 4, label: "Tung" },
  { value: 6, label: "Krävande" },
  { value: 8, label: "Mycket tung" },
];

const initialTask: CreateTaskBody = {
  name: "",
  description: "",
  frequency: 7,
  difficultyLevel: 2,
};

function close() {
  if (router.canGoBack()) router.back();
}

export default function CreateTask() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [task, setTask] = useState<CreateTaskBody>(initialTask);

  const householdId = useActiveHouseholdId();
  const { data: taskById } = useQuery(
    taskQueryOptions(householdId, id ? Number(id) : undefined),
  );

  const [prefilledId, setPrefilledId] = useState<number | null>(null);
  const { showToast } = useToast();

  if (taskById && prefilledId !== taskById.id) {
    setPrefilledId(taskById.id);
    setTask({
      name: taskById.name,
      description: taskById.description,
      frequency: taskById.frequency,
      difficultyLevel: taskById.difficultyLevel,
    });
  }

  const update = <K extends keyof CreateTaskBody>(
    key: K,
    value: CreateTaskBody[K],
  ) => setTask((prev) => ({ ...prev, [key]: value }));

  const isEditing = !!id;

  // Only admins may assign members (the API rejects others)
  const { data: household } = useQuery(householdQueryOptions(householdId));
  const isAdmin =
    household?.members.some((member) => member.isMe && member.isAdmin) ?? false;
  const [selectedMemberIds, setSelectedMemberIds] = useState<
    ReadonlySet<number>
  >(new Set());
  // Set when the task was created but some members could not be assigned,
  // so saving again retries only those instead of creating a duplicate task
  const [partialSave, setPartialSave] = useState<{
    taskId: number;
    assignedMemberIds: ReadonlySet<number>;
    error: string;
  } | null>(null);
  const isLocked = partialSave !== null;

  const toggleMember = (memberId: number) =>
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });

  const saveTaskMutation = useMutation({
    mutationFn: async (body: CreateTaskBody) => {
      if (!householdId) throw new Error("Inget aktivt hushåll");
      if (isEditing) {
        const saved = await updateTask(householdId, Number(id), body);
        return {
          taskId: saved.id,
          assignedMemberIds: new Set<number>(),
          error: undefined,
        };
      }

      const taskId =
        partialSave?.taskId ?? (await createTask(householdId, body)).id;
      const assignedMemberIds = new Set(partialSave?.assignedMemberIds);
      const memberIds = [...selectedMemberIds].filter(
        (memberId) => !assignedMemberIds.has(memberId),
      );
      const results = await Promise.allSettled(
        memberIds.map((memberId) =>
          assignTask(householdId, { taskId, memberId }),
        ),
      );
      results.forEach((result, index) => {
        if (result.status === "fulfilled")
          assignedMemberIds.add(memberIds[index]);
      });
      const failure = results.find((result) => result.status === "rejected");

      return {
        taskId,
        assignedMemberIds,
        error: failure
          ? failure.reason instanceof Error
            ? failure.reason.message
            : String(failure.reason)
          : undefined,
      };
    },
    onSuccess: async ({ taskId, assignedMemberIds, error }, body) => {
      // Also covers the single task, whose key starts with the list's key
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tasksQueryOptions(householdId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: taskAssignmentsQueryOptions(householdId).queryKey,
        }),
      ]);
      if (error) {
        setPartialSave({ taskId, assignedMemberIds, error });
        showToast({
          message: `Syssla ${body.name} skapad men tilldelningen misslyckades: ${error}`,
          type: "error",
          duration: 5000,
          position: "bottom",
        });
        return;
      }

      setTask(initialTask);
      setSelectedMemberIds(new Set());
      setPartialSave(null);

      showToast({
        message: `Syssla ${body.name} har ${isEditing ? "uppdaterats" : "skapats"}`,
        type: "success",
        duration: 5000,
        position: "bottom",
      });
      if (router.canGoBack()) {
        setTimeout(() => router.back(), 100);
      } else {
        Alert.alert(
          isEditing ? "Syssla uppdaterad" : "Syssla skapad",
          body.name,
        );
      }
    },
    onError: (error) => {
      Alert.alert("Något gick fel", String(error));
    },
  });

  const canSave =
    !!householdId &&
    createTaskBodySchema.safeParse(task).success &&
    !saveTaskMutation.isPending;

  const handleSave = () => {
    const result = createTaskBodySchema.safeParse(task);
    if (!result.success) {
      return;
    }

    saveTaskMutation.mutate(result.data);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
  ];
  const labelStyle = [styles.label, { color: colors.textMuted }];
  const panelStyle = [styles.panel, { backgroundColor: colors.surface }];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      {
        /* */
      }

      <View style={styles.section}>
        <Text style={labelStyle}>Titel</Text>
        <TextInput
          value={task.name}
          onChangeText={(value) => update("name", value)}
          placeholder={
            taskById?.name ? taskById.name : "T.ex. Dammsuga vardagsrummet"
          }
          placeholderTextColor={colors.textMuted}
          editable={!isLocked}
          style={inputStyle}
        />
      </View>

      <View style={styles.section}>
        <Text style={labelStyle}>Beskrivning</Text>
        <TextInput
          value={task.description}
          onChangeText={(value) => update("description", value)}
          placeholder="Beskriv vad som ska göras eller speciella önskemål…"
          placeholderTextColor={colors.textMuted}
          multiline
          editable={!isLocked}
          style={[inputStyle, styles.multiline]}
        />
      </View>

      {/* Not functional yet: attachments are not part of the task model. */}
      <View style={styles.section}>
        <Text style={[labelStyle, styles.caps]}>
          Hjälpmedel & instruktioner
        </Text>
        <View style={styles.row}>
          {["📷  Lägg till bild", "🎙  Spela in röst"].map((label) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={[
                styles.aidButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.aidText, { color: colors.text }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={panelStyle}>
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Återkommer
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.background }]}>
            {task.frequency === 0 ? (
              <Text style={[styles.badgeText, { color: colors.text }]}>
                Endast en gång
              </Text>
            ) : (
              <>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  var
                </Text>
                <View
                  style={[
                    styles.badgeValue,
                    { backgroundColor: colors.primary },
                  ]}>
                  <Text style={styles.selectedText}>{task.frequency}</Text>
                </View>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  dag{task.frequency === 1 ? "" : "ar"}
                </Text>
              </>
            )}
          </View>
        </View>
        <FrequencyPicker
          selected={task.frequency}
          disabled={isLocked}
          onSelect={(value) => update("frequency", value)}
        />
      </View>

      <View style={panelStyle}>
        <View style={styles.panelHeader}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Värde (Energi)
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.background }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {task.difficultyLevel}
            </Text>
          </View>
        </View>
        <DifficultyPicker
          selected={task.difficultyLevel}
          disabled={isLocked}
          onSelect={(value) => update("difficultyLevel", value)}
        />
      </View>

      {!isEditing && isAdmin && household && (
        <View style={panelStyle}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Vill du tilldela sysslan?
          </Text>
          <TaskMemberPicker
            members={household.members}
            selectedMemberIds={selectedMemberIds}
            isPending={isLocked || saveTaskMutation.isPending}
            onToggle={toggleMember}
          />
        </View>
      )}

      {partialSave && (
        <Text accessibilityRole="alert" style={{ color: colors.text }}>
          Sysslan skapades, men tilldelningen misslyckades: {partialSave.error}.
          Tryck på Försök igen.
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={handleSave}
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 },
          ]}>
          <Text style={styles.buttonText}>
            {isLocked ? "Försök igen" : "Spara syssla"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.text }]}>
            Avbryt
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function FrequencyPicker({
  selected,
  disabled,
  onSelect,
}: {
  selected: number;
  disabled: boolean;
  onSelect: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      contentContainerStyle={styles.frequencyRow}>
      {frequencyOptions.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(value)}
            style={[
              styles.circle,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : colors.background,
              },
            ]}>
            <Text
              style={[
                styles.circleText,
                isSelected ? styles.selectedText : { color: colors.text },
              ]}>
              {value}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function DifficultyPicker({
  selected,
  disabled,
  onSelect,
}: {
  selected: number;
  disabled: boolean;
  onSelect: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {difficultyOptions.map(({ value, label }) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={`${value}, ${label}`}
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(value)}
            style={[
              styles.tile,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : colors.background,
              },
            ]}>
            <Text
              style={[
                styles.tileValue,
                isSelected ? styles.selectedText : { color: colors.text },
              ]}>
              {value}
            </Text>
            <Text
              style={[
                styles.tileLabel,
                isSelected ? styles.selectedText : { color: colors.textMuted },
              ]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heading: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  caps: {
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  aidButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.5,
  },
  aidText: {
    fontSize: 14,
    fontWeight: "500",
  },
  panel: {
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 28,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badgeValue: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  frequencyRow: {
    gap: 8,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 15,
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 10,
    gap: 2,
  },
  tileValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  tileLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  actions: {
    gap: 4,
  },
  button: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
