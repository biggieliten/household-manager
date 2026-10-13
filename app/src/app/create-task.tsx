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
import { router } from "expo-router";

import { useTheme } from "@/theme";
import type { TaskCreate } from "@/types/task";

const frequencyOptions = [1, 2, 3, 7, 14, 30];
const difficultyOptions = [1, 2, 4, 6, 8];

const initialTask: TaskCreate = {
  name: "",
  description: "",
  frequency: 7,
  difficultyLevel: 2,
};

export default function CreateTask() {
  const { colors } = useTheme();
  const [task, setTask] = useState<TaskCreate>(initialTask);

  const update = <K extends keyof TaskCreate>(key: K, value: TaskCreate[K]) =>
    setTask((prev) => ({ ...prev, [key]: value }));

  const canSave = task.name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;

    const payload: TaskCreate = {
      ...task,
      name: task.name.trim(),
      description: task.description.trim(),
    };

    // TODO: send payload to the backend. It will add id, isActive and houseHoldId.
    console.log("Create task", payload);

    setTask(initialTask);
    if (router.canGoBack()) {
      router.back();
    } else {
      Alert.alert("Syssla skapad", payload.name);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Titel</Text>
        <TextInput
          value={task.name}
          onChangeText={(value) => update("name", value)}
          placeholder="t.ex. Dammsuga"
          placeholderTextColor={colors.textMuted}
          style={inputStyle}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Beskrivning
        </Text>
        <TextInput
          value={task.description}
          onChangeText={(value) => update("description", value)}
          placeholder="Beskriv sysslan"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[inputStyle, styles.multiline]}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          Återkommer var {task.frequency} dag{task.frequency === 1 ? "" : "ar"}
        </Text>
        <OptionRow
          options={frequencyOptions}
          selected={task.frequency}
          onSelect={(value) => update("frequency", value)}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Värde</Text>
        <OptionRow
          options={difficultyOptions}
          selected={task.difficultyLevel}
          onSelect={(value) => update("difficultyLevel", value)}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
        disabled={!canSave}
        onPress={handleSave}
        style={[
          styles.button,
          { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 },
        ]}
      >
        <Text style={styles.buttonText}>Spara</Text>
      </Pressable>
    </ScrollView>
  );
}

function OptionRow({
  options,
  selected,
  onSelect,
}: {
  options: number[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        styles.optionRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {options.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={() => onSelect(value)}
            style={[
              styles.option,
              isSelected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: isSelected ? "#FFFFFF" : colors.text },
              ]}
            >
              {value}
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
    paddingVertical: 24,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
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
  optionRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
  option: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
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
});
