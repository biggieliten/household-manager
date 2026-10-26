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
import { File as FileSystemFile, UploadType } from "expo-file-system";
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

export async function deleteTask(
  householdId: number,
  taskId: number,
): Promise<void> {
  const res = await getClient().api.v1.households[":householdId"].tasks[
    ":taskId"
  ].$delete({
    param: {
      householdId: String(householdId),
      taskId: String(taskId),
    },
  });
  if (!res.ok) throw new Error(`Kunde inte ta bort syssla (${res.status})`);
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

// The API answers JSON; a non-JSON body (e.g. a proxy error page) becomes undefined
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// The API's { error } body, so failures can say why the upload was rejected
function apiErrorMessage(body: unknown): string | undefined {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : undefined;
}

// fileUri is a local file from expo-image-picker or expo-audio. The upload is
// sent as multipart/form-data with expo-file-system's native upload, because it
// lets us set mimeType: Android guesses e.g. audio/mpeg for .m4a recordings
export async function uploadTaskMedia(
  householdId: number,
  taskId: number,
  kind: TaskMediaKind,
  fileUri: string,
  mimeType: string,
): Promise<TaskMedia> {
  const { route, param } = mediaRoute(householdId, taskId, kind);
  const result = await new FileSystemFile(fileUri).upload(
    route.$url({ param }).toString(),
    {
      httpMethod: "PUT",
      uploadType: UploadType.MULTIPART,
      fieldName: "file",
      mimeType,
      headers: await getAuthHeaders(),
      // A short upload we wait for, not a transfer that should outlive the app
      sessionType: "foreground",
    },
  );

  const body = parseJson(result.body);
  if (result.status < 200 || result.status >= 300) {
    const reason = apiErrorMessage(body);
    throw new Error(
      `Kunde inte ladda upp ${mediaLabel[kind]} (${result.status})` +
        (reason ? `: ${reason}` : ""),
    );
  }

  return responseTaskMediaSchema.parse(body);
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
