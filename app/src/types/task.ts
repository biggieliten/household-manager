//getTask
export interface Task {
  id: number;
  name: string;
  description: string;
  frequency: number;
  isArchived: boolean;
  difficultyLevel: number;
  householdId: number;
}

// Mirrors the avatar values and latest completion relation in api/prisma/schema.prisma.
export type Avatar =
  | "FOX"
  | "PIG"
  | "FROG"
  | "CHICKEN"
  | "OCTOPUS"
  | "DOLPHIN"
  | "OWL"
  | "UNICORN";

export type TaskListItem = Task & {
  latestCompletion: {
    completedAt: Date;
    member: { avatar: Avatar };
  } | null;
};
