import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ImageSource } from "@/lib/pick-task-image";
import { useTheme } from "@/theme";

type Props = {
  disabled: boolean;
  onPick: (source: ImageSource) => void;
};

const choices: {
  source: ImageSource;
  icon: keyof typeof Feather.glyphMap;
  label: string;
}[] = [
  { source: "library", icon: "image", label: "Välj från biblioteket" },
  { source: "camera", icon: "camera", label: "Ta ett foto" },
];

// Shown inline under "Lägg till bild" instead of an action sheet
export default function ImageSourceChoice({ disabled, onPick }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      {choices.map(({ source, icon, label }, index) => (
        <Pressable
          key={source}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => onPick(source)}
          style={[
            styles.choice,
            index > 0 && {
              borderTopColor: colors.border,
              borderTopWidth: StyleSheet.hairlineWidth,
            },
          ]}>
          <Feather name={icon} size={18} color={colors.text} />
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
});
