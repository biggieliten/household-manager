import type { Avatar } from "@shared/schemas/member-schema";

// Each avatar has a fixed emoji and color, used everywhere in the app
export const avatars: Record<Avatar, { emoji: string; color: string }> = {
  FOX: { emoji: "🦊", color: "#F0866A" },
  PIG: { emoji: "🐷", color: "#F2A7C3" },
  FROG: { emoji: "🐸", color: "#7BC47F" },
  CHICKEN: { emoji: "🐥", color: "#EDC45E" },
  OCTOPUS: { emoji: "🐙", color: "#C9546F" },
  DOLPHIN: { emoji: "🐬", color: "#5FA8D3" },
  OWL: { emoji: "🦉", color: "#A47551" },
  UNICORN: { emoji: "🦄", color: "#A68BE0" },
};
