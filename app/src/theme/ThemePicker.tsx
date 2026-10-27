import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ThemePreference } from "./atoms";
import { useTheme } from "./useTheme";

const options: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Ljus" },
  { value: "dark", label: "Mörk" },
  { value: "system", label: "Auto" },
];

export function ThemePicker() {
  const { preference, setPreference, colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {options.map(({ value, label }) => {
        const selected = preference === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => setPreference(value)}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.onPrimary : colors.text },
              ]}
            >
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
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
