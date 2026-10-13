//getTask
export interface Task {
  id: number;
  name: string;
  description: string;
  frequency: number;
  isActive: boolean;
  difficultyLevel: number;
  houseHoldId: number;
}
export type TaskCreate = Omit<Task, "id" | "isActive" | "houseHoldId">;
