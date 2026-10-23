import {
  type CompletedTask,
  responseCompletedTaskSchema,
} from "@shared/schemas/completed-task-schema";
import {
  responseTaskMediaSchema,
  type TaskMedia,
  type TaskMediaKind,
} from "@shared/schemas/task-media-schema";
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
import { File as FileSystemFile } from "expo-file-system";
import { fetch } from "expo/fetch";
import { getAuthHeaders, getClient } from "./client";

export async function fetchHouseholdTasks(
  householdId: number,
): Promise<TaskListItem[]> {
  const res = await getClient().api.v1.households[":householdId"].tasks.$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta sysslor (${res.status})`);

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

const mediaLabel = { image: "bilden", audio: "röstmeddelandet" } as const;

const mediaRoute = (
  householdId: number,
  taskId: number,
  kind: TaskMediaKind,
) => ({
  route:
    getClient().api.v1.households[":householdId"].tasks[":taskId"].media[
      ":kind"
    ],
  param: { householdId: String(householdId), taskId: String(taskId), kind },
});

// fileUri is a local file from expo-image-picker or expo-audio.
// Uploads are sent as multipart/form-data. The typed client only accepts the
// browser's File type for form fields, and expo-file-system's File isn't one,
// so we build the FormData ourselves and send it with fetch.
export async function uploadTaskMedia(
  householdId: number,
  taskId: number,
  kind: TaskMediaKind,
  fileUri: string,
): Promise<TaskMedia> {
  const { route, param } = mediaRoute(householdId, taskId, kind);
  const form = new FormData();
  form.append("file", new FileSystemFile(fileUri));

  const res = await fetch(route.$url({ param }).toString(), {
    method: "PUT",
    body: form,
    headers: await getAuthHeaders(),
    credentials: "omit",
  });
  if (!res.ok)
    throw new Error(`Kunde inte ladda upp ${mediaLabel[kind]} (${res.status})`);

  return responseTaskMediaSchema.parse(await res.json());
}

export async function deleteTaskMedia(
  householdId: number,
  taskId: number,
  kind: TaskMediaKind,
): Promise<void> {
  const { route, param } = mediaRoute(householdId, taskId, kind);
  const res = await route.$delete({ param });
  if (!res.ok)
    throw new Error(`Kunde inte ta bort ${mediaLabel[kind]} (${res.status})`);
}

// Full URL for <Image> and useAudioPlayer. ?v= changes when the file is replaced,
// so the image cache never shows an old version. Send getAuthHeaders() with it.
export function taskMediaUrl(
  householdId: number,
  taskId: number,
  media: Pick<TaskMedia, "kind" | "updatedAt">,
): string {
  const { route, param } = mediaRoute(householdId, taskId, media.kind);
  const url = route.$url({ param });
  url.searchParams.set("v", String(media.updatedAt.getTime()));
  return url.toString();
}
