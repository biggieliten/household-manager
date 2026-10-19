import type { CreateTaskBody, Task } from "@shared/schemas/task-schema";
import { responseTaskSchema } from "@shared/schemas/task-schema";
import type { TaskListItem } from "@/types/task";
import { getClient } from "./client";

export async function fetchHouseholdTasks(
  householdId: number,
): Promise<TaskListItem[]> {
  const res = await getClient().api.v1.households[":householdId"].tasks.$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta sysslor (${res.status})`);

  const tasks = await res.json();
  return tasks.map((task) => ({
    ...task,
    completedTasks: task.completedTasks.map((completion) => ({
      ...completion,
      completedAt: new Date(completion.completedAt),
    })),
  }));
}

export async function createTask(
  householdId: number,
  body: CreateTaskBody,
): Promise<Task> {
  const res = await getClient().api.v1.households[":householdId"].tasks.$post({
    param: { householdId: String(householdId) },
    json: body,
  });
  if (!res.ok) throw new Error(`Kunde inte skapa syssla (${res.status})`);

  return responseTaskSchema.parse(await res.json());
}
