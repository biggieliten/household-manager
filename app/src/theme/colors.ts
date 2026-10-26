export const colors = {
  light: {
    background: "#FFFFFF",
    surface: "#F2F2F7",
    text: "#11181C",
    textMuted: "#687076",
    primary: "#208AEF",
    border: "#E1E3E6",
    // Behind cards, e.g. the task list
    screen: "#F2F2F7",
    card: "#FFFFFF",
    // Small pills and avatar circles
    chip: "#ECEBFD",
    warning: "#FEF3C7",
    warningText: "#92400E",
    // Destructive actions, e.g. swipe-to-delete
    danger: "#A63A3A",
    // Confirmations, e.g. success toasts
    success: "#2E7D32",
  },
  dark: {
    background: "#0B0B0D",
    surface: "#1C1C1E",
    text: "#ECEDEE",
    textMuted: "#9BA1A6",
    primary: "#4DA3F5",
    border: "#2C2C2E",
    screen: "#0B0B0D",
    card: "#1C1C1E",
    chip: "#33354A",
    warning: "#3A2E14",
    warningText: "#FCD34D",
    danger: "#B04646",
    success: "#3D8B40",
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof typeof colors.light]: string };
