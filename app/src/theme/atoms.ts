import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Appearance } from "react-native";

import { createKvStorage } from "@/lib/storage";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme-preference";
const storage = createKvStorage<ThemePreference>();

// Native UI (tab bar, alerts, keyboard) follows the app-wide color scheme, so it
// must be switched *before* React re-renders, otherwise native views read the old one.
function applyToNative(preference: ThemePreference) {
  Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
}

// Storage is synchronous, so apply the saved preference before the first render.
applyToNative(storage.getItem(STORAGE_KEY, "system") as ThemePreference);

const storedPreferenceAtom = atomWithStorage<ThemePreference>(
  STORAGE_KEY,
  "system",
  storage,
  { getOnInit: true },
);

export const themePreferenceAtom = atom(
  (get) => get(storedPreferenceAtom),
  (_get, set, preference: ThemePreference) => {
    applyToNative(preference);
    set(storedPreferenceAtom, preference);
  },
);
