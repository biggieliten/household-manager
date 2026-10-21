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
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof typeof colors.light]: string };
