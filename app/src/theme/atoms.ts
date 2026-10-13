import { atomWithStorage } from "jotai/utils";

import { createKvStorage } from "@/lib/storage";

export type ThemePreference = "system" | "light" | "dark";

export const themePreferenceAtom = atomWithStorage<ThemePreference>(
  "theme-preference",
  "system",
  createKvStorage<ThemePreference>(),
  { getOnInit: true },
);
