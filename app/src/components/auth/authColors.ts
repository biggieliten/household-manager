import { useTheme } from "@/theme";

// Palette for the sign-in / sign-up screen (warm red on soft lavender)
const authColors = {
  light: {
    background: "#F8F6FE",
    card: "#FFFFFF",
    field: "#F3F1FC",
    segment: "#F1EEFB",
    segmentActive: "#FFFFFF",
    text: "#2A2440",
    textMuted: "#6B6480",
    placeholder: "#9A8C95",
    divider: "#ECE9F5",
    primary: "#A3393A",
    onPrimary: "#FFFFFF",
    secure: "#2F6B4F",
  },
  dark: {
    background: "#121016",
    card: "#1C1A22",
    field: "#26232E",
    segment: "#26232E",
    segmentActive: "#3A3546",
    text: "#ECEAF2",
    textMuted: "#A49FB3",
    placeholder: "#7D778A",
    divider: "#2E2B36",
    primary: "#C9504F",
    onPrimary: "#FFFFFF",
    secure: "#5FB38A",
  },
} as const;

export type AuthColors = { [K in keyof typeof authColors.light]: string };

export function useAuthColors(): AuthColors {
  const { scheme } = useTheme();
  return authColors[scheme];
}

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
} as const;
