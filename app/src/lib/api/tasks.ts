import type {
  CreateTaskBody,
  Task,
  TaskListItem,
} from "@shared/schemas/task-schema";
import {
  responseTaskListItemSchema,
  responseTaskSchema,
} from "@shared/schemas/task-schema";
import { getClient } from "./client";

export async function fetchHouseholdTasks(
  householdId: number,
): Promise<TaskListItem[]> {
  const res = await getClient().api.v1.households[":householdId"].tasks.$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta sysslor (${res.status})`);

  return responseTaskListItemSchema.array().parse(await res.json());
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
