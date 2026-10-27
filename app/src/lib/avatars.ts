import type { ThemeColors } from "@/theme";
import type { Avatar } from "@shared/schemas/member-schema";

type AvatarColorKey = Extract<keyof ThemeColors, `avatar${string}`>;

// Avatar colors are resolved through the shared theme.
export const avatars: Record<Avatar, { emoji: string; colorKey: AvatarColorKey }> = {
  FOX: { emoji: "🦊", colorKey: "avatarFox" },
  PIG: { emoji: "🐷", colorKey: "avatarPig" },
  FROG: { emoji: "🐸", colorKey: "avatarFrog" },
  CHICKEN: { emoji: "🐥", colorKey: "avatarChicken" },
  OCTOPUS: { emoji: "🐙", colorKey: "avatarOctopus" },
  DOLPHIN: { emoji: "🐬", colorKey: "avatarDolphin" },
  OWL: { emoji: "🦉", colorKey: "avatarOwl" },
  UNICORN: { emoji: "🦄", colorKey: "avatarUnicorn" },
};
