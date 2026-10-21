import { Pressable, StyleSheet, Text, View } from "react-native";

import { avatars } from "@/lib/avatars";
import { useTheme } from "@/theme";
import { avatarSchema, type Avatar } from "@shared/schemas/member-schema";

// Avatars already used in the household are shown faded and cannot be picked
export default function AvatarPicker({
  value,
  onChange,
  disabled = false,
  taken = [],
}: {
  value: Avatar | null;
  onChange: (avatar: Avatar) => void;
  disabled?: boolean;
  taken?: Avatar[];
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        Välj avatar
      </Text>
      <View style={styles.avatars}>
        {avatarSchema.options.map((option) => {
          const selected = value === option;
          const isTaken = taken.includes(option);
          const isDisabled = disabled || isTaken;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ selected, disabled: isDisabled }}
              disabled={isDisabled}
              onPress={() => onChange(option)}
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.background,
                  borderColor: selected ? colors.primary : colors.border,
                },
                isTaken && styles.avatarTaken,
              ]}>
              <Text style={styles.avatarEmoji}>{avatars[option].emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  avatars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTaken: {
    opacity: 0.3,
  },
  avatarEmoji: {
    fontSize: 22,
  },
});
