import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
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

import { HOUSEHOLD_ID } from "@/lib/api/client";
import { createTask } from "@/lib/api/tasks";
import { useTheme } from "@/theme";
import type { CreateTaskBody } from "@shared/schemas/task-schema";
import { createTaskBodySchema } from "@shared/schemas/task-schema";

const frequencyOptions = Array.from({ length: 31 }, (_, i) => i);
const difficultyOptions = [
  { value: 1, label: "Lätt" },
  { value: 2, label: "Normal" },
  { value: 4, label: "Tung" },
  { value: 6, label: "Krävande" },
  { value: 8, label: "Mycket tung" },
];

// Placeholder avatars until household members are fetched from the backend.
const exampleAssignees = ["🦊", "🐸", "🐷"];

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
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [task, setTask] = useState<CreateTaskBody>(initialTask);

  const update = <K extends keyof CreateTaskBody>(
    key: K,
    value: CreateTaskBody[K],
  ) => setTask((prev) => ({ ...prev, [key]: value }));

  const createTaskMutation = useMutation({
    mutationFn: (body: CreateTaskBody) => createTask(HOUSEHOLD_ID, body),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["tasks", HOUSEHOLD_ID] });
      setTask(initialTask);
      if (router.canGoBack()) {
        router.back();
      } else {
        Alert.alert("Syssla skapad", created.name);
      }
    },
    onError: (error) => {
      Alert.alert("Något gick fel", String(error));
    },
  });

  const canSave =
    createTaskBodySchema.safeParse(task).success &&
    !createTaskMutation.isPending;

  const handleSave = () => {
    const result = createTaskBodySchema.safeParse(task);
    if (!result.success) return;

    createTaskMutation.mutate(result.data);
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
      keyboardShouldPersistTaps='handled'>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.heading, { color: colors.text }]}>
          Skapa en ny syssla
        </Text>
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Stäng'
          onPress={close}
          style={[styles.closeButton, { backgroundColor: colors.surface }]}>
          <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={labelStyle}>Titel</Text>
        <TextInput
          value={task.name}
          onChangeText={(value) => update("name", value)}
          placeholder='T.ex. Dammsuga vardagsrummet'
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />
      </View>

      <View style={styles.section}>
        <Text style={labelStyle}>Beskrivning</Text>
        <TextInput
          value={task.description}
          onChangeText={(value) => update("description", value)}
          placeholder='Beskriv vad som ska göras eller speciella önskemål…'
          placeholderTextColor={colors.textMuted}
          multiline
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
              accessibilityRole='button'
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
          onSelect={(value) => update("difficultyLevel", value)}
        />
      </View>

      {/* Not functional yet: assignment will use the household's members. */}
      <View style={styles.assignRow}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>
          Tilldela
        </Text>
        <View style={styles.avatars}>
          {exampleAssignees.map((emoji, index) => (
            <View
              key={emoji}
              style={[
                styles.avatar,
                index > 0 && styles.avatarOverlap,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.background,
                },
              ]}>
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </View>
          ))}
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Tilldela medlem'
            accessibilityState={{ disabled: true }}
            disabled
            style={[
              styles.avatar,
              styles.avatarOverlap,
              styles.disabled,
              {
                backgroundColor: colors.surface,
                borderColor: colors.background,
              },
            ]}>
            <Text style={[styles.addText, { color: colors.text }]}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole='button'
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={handleSave}
          style={[
            styles.button,
            { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 },
          ]}>
          <Text style={styles.buttonText}>Spara syssla</Text>
        </Pressable>
        <Pressable
          accessibilityRole='button'
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
  onSelect,
}: {
  selected: number;
  onSelect: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole='radiogroup'
      contentContainerStyle={styles.frequencyRow}>
      {frequencyOptions.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole='radio'
            accessibilityState={{ checked: isSelected }}
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
  onSelect,
}: {
  selected: number;
  onSelect: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole='radiogroup' style={styles.row}>
      {difficultyOptions.map(({ value, label }) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole='radio'
            accessibilityLabel={`${value}, ${label}`}
            accessibilityState={{ checked: isSelected }}
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
  assignRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatars: {
    flexDirection: "row",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  addText: {
    fontSize: 18,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
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
