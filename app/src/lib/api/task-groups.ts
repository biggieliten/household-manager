import {
  responseTaskGroupSchema,
  type TaskGroup,
  type TaskGroupBody,
} from "@shared/schemas/task-group-schema";
import { ApiError } from "@/lib/errors";
import { getClient } from "./client";

export async function fetchTaskGroups(householdId: number): Promise<TaskGroup[]> {
  const res = await getClient().api.v1.households[":householdId"]["task-groups"].$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok)
    throw new ApiError(`Kunde inte hämta sysslegrupper (${res.status})`, res.status);
  return responseTaskGroupSchema.array().parse(await res.json());
}

export async function createTaskGroup(
  householdId: number,
  body: TaskGroupBody,
): Promise<TaskGroup> {
  const res = await getClient().api.v1.households[":householdId"]["task-groups"].$post({
    param: { householdId: String(householdId) },
    json: body,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }
  return responseTaskGroupSchema.parse(await res.json());
}

export async function updateTaskGroup(
  householdId: number,
  groupId: number,
  body: TaskGroupBody,
): Promise<TaskGroup> {
  const res = await getClient().api.v1.households[":householdId"]["task-groups"][":groupId"].$patch({
    param: { householdId: String(householdId), groupId: String(groupId) },
    json: body,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }
  return responseTaskGroupSchema.parse(await res.json());
}

export async function deleteTaskGroup(
  householdId: number,
  groupId: number,
): Promise<void> {
  const res = await getClient().api.v1.households[":householdId"]["task-groups"][":groupId"].$delete({
    param: { householdId: String(householdId), groupId: String(groupId) },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }
}
