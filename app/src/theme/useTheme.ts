import { useAtom } from "jotai";
import { useColorScheme } from "react-native";

import { themePreferenceAtom } from "./atoms";
import { colors, type ColorScheme } from "./colors";

export function useTheme() {
  const [preference, setPreference] = useAtom(themePreferenceAtom);
  const systemScheme = useColorScheme();
  const scheme: ColorScheme =
    preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

  return { preference, setPreference, scheme, colors: colors[scheme] };
}
