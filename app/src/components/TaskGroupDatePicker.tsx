import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { View } from "react-native";

import { useTheme } from "@/theme";

export type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function TaskGroupDatePicker({
  value,
  onChange,
  disabled = false,
}: Props) {
  const { colors, scheme } = useTheme();

  return (
    <View pointerEvents={disabled ? "none" : "auto"}>
      <DateTimePicker
        value={new Date(`${value}T12:00:00`)}
        mode="date"
        display="inline"
        presentation="inline"
        locale="sv_SE"
        themeVariant={scheme}
        accentColor={colors.primary}
        disabled={disabled}
        onValueChange={(_event, date) => {
          if (disabled) return;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          onChange(`${year}-${month}-${day}`);
        }}
      />
    </View>
  );
}
