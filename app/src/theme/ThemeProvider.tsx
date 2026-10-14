import type { ReactNode } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from "expo-router";

import { colors, type ColorScheme } from "./colors";
import { useTheme } from "./useTheme";

function toNavigationTheme(scheme: ColorScheme): Theme {
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const palette = colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      primary: palette.primary,
      border: palette.border,
    },
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { scheme } = useTheme();

  return (
    <NavigationThemeProvider value={toNavigationTheme(scheme)}>
      {children}
    </NavigationThemeProvider>
  );
}
