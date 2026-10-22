import { useTheme } from "@/theme";
import type { Props } from "./TaskGroupDatePicker";

export default function TaskGroupDatePicker({
  value,
  onChange,
  disabled = false,
}: Props) {
  const { colors, scheme } = useTheme();

  return (
    <input
      type="date"
      aria-label="Startdatum"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      disabled={disabled}
      style={{
        color: colors.text,
        backgroundColor: colors.surface,
        colorScheme: scheme,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        width: "100%",
        boxSizing: "border-box",
      }}
    />
  );
}
