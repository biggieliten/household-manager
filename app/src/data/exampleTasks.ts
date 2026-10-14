import type { TaskListItem } from "@/types/task";

// Keep the example completions relative to today so their statuses remain useful.
function daysAgo(days: number): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - days, 12);
}

export const exampleTasks: TaskListItem[] = [
  {
    id: 1,
    name: "Laga mat",
    description: "Laga dagens måltid",
    frequency: 1,
    isActive: true,
    difficultyLevel: 3,
    houseHoldId: 1,
    latestCompletion: { completedAt: daysAgo(0), member: { avatar: "FOX" } },
  },
  {
    id: 2,
    name: "Damma",
    description: "Vardagsrum & hyllor",
    frequency: 7,
    isActive: true,
    difficultyLevel: 1,
    houseHoldId: 1,
    latestCompletion: { completedAt: daysAgo(7), member: { avatar: "PIG" } },
  },
  {
    id: 3,
    name: "Diska",
    description: "Ta hand om disken",
    frequency: 1,
    isActive: true,
    difficultyLevel: 2,
    houseHoldId: 1,
    latestCompletion: { completedAt: daysAgo(0), member: { avatar: "CHICKEN" } },
  },
  {
    id: 4,
    name: "Ta hand om My",
    description: "Matning och kvällspromenad",
    frequency: 1,
    isActive: true,
    difficultyLevel: 4,
    houseHoldId: 1,
    latestCompletion: null,
  },
  {
    id: 5,
    name: "Torka golvet",
    description: "Behöver göras snart!",
    frequency: 7,
    isActive: true,
    difficultyLevel: 3,
    houseHoldId: 1,
    latestCompletion: { completedAt: daysAgo(24), member: { avatar: "DOLPHIN" } },
  },
  {
    id: 6,
    name: "Vattna blommor",
    description: "Balkong & fönsterbrädor",
    frequency: 3,
    isActive: true,
    difficultyLevel: 1,
    houseHoldId: 1,
    latestCompletion: { completedAt: daysAgo(2), member: { avatar: "OCTOPUS" } },
  },
];
