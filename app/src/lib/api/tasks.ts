import {
  type CompletedTask,
  responseCompletedTaskSchema,
} from "@shared/schemas/completed-task-schema";
import type {
  CreateTaskBody,
  Task,
  TaskListItem,
  UpdateTaskInput,
} from "@shared/schemas/task-schema";
import {
  responseTaskListItemSchema,
  responseTaskSchema,
} from "@shared/schemas/task-schema";
import { ApiError } from "@/lib/errors";
import { getClient } from "./client";

export async function fetchHouseholdTasks(
  householdId: number,
): Promise<TaskListItem[]> {
  const res = await getClient().api.v1.households[":householdId"].tasks.$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok)
    throw new ApiError(`Kunde inte hämta sysslor (${res.status})`, res.status);

  return responseTaskListItemSchema.array().parse(await res.json());
}

export async function getTaskById(
  householdId: number,
  taskId: number,
): Promise<Task> {
  const res = await getClient().api.v1.households[":householdId"].tasks[
    ":taskId"
  ].$get({
    param: {
      householdId: String(householdId),
      taskId: String(taskId),
    },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta syssla (${res.status})`);

  return responseTaskSchema.parse(await res.json());
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

export async function completeTask(
  householdId: number,
  taskId: number,
): Promise<CompletedTask> {
  const res = await getClient().api.v1.households[":householdId"].tasks[
    ":taskId"
  ].completions.$post({
    param: {
      householdId: String(householdId),
      taskId: String(taskId),
    },
  });
  if (!res.ok)
    throw new Error(`Kunde inte markera sysslan som klar (${res.status})`);

  return responseCompletedTaskSchema.parse(await res.json());
}

export async function updateTask(
  householdId: number,
  taskId: number,
  body: UpdateTaskInput,
): Promise<Task> {
  const res = await getClient().api.v1.households[":householdId"].tasks[
    ":taskId"
  ].$patch({
    param: {
      householdId: String(householdId),
      taskId: String(taskId),
    },
    json: body,
  });
  if (!res.ok) throw new Error(`Kunde inte uppdatera syssla (${res.status})`);

  return responseTaskSchema.parse(await res.json());
}

export async function archiveTask(
  householdId: number,
  taskId: number,
): Promise<Task> {
  const res = await getClient().api.v1.households[":householdId"].tasks[
    ":taskId"
  ].archive.$patch({
    param: {
      householdId: String(householdId),
      taskId: String(taskId),
    },
  });
  if (!res.ok) throw new Error(`Kunde inte arkivera syssla (${res.status})`);

  return responseTaskSchema.parse(await res.json());
}
