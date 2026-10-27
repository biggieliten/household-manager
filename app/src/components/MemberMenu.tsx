import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export type MemberMenuItem = {
  label: string;
  onPress: () => void;
};

type Props = {
  open: boolean;
  onToggle: () => void;
  items: MemberMenuItem[];
};

export default function MemberMenu({ open, onToggle, items }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fler alternativ"
        onPress={onToggle}
        hitSlop={8}
        style={styles.trigger}>
        <Text style={[styles.dots, { color: colors.textMuted }]}>⋯</Text>
      </Pressable>

      {open && (
        <View
          style={[
            { ...styles.menu, shadowColor: colors.shadow },
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="menuitem"
              onPress={() => {
                onToggle();
                item.onPress();
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: colors.surface },
              ]}>
              <Text style={{ color: colors.text }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 6,
  },
  dots: {
    fontSize: 22,
    fontWeight: "700",
  },
  menu: {
    position: "absolute",
    top: 32,
    right: 0,
    minWidth: 160,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    elevation: 6,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
