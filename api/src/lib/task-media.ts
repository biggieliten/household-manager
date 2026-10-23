import type { TaskMediaKind } from "../../../shared/schemas/task-media-schema.ts";
import { MediaKind } from "../generated/prisma/client.ts";

// The API uses "image"/"audio" in URLs and responses, the database uses the MediaKind enum
export const toMediaKind = (kind: TaskMediaKind): MediaKind =>
  kind === "image" ? MediaKind.IMAGE : MediaKind.AUDIO;

export const fromMediaKind = (kind: MediaKind): TaskMediaKind =>
  kind === MediaKind.IMAGE ? "image" : "audio";

// What a task response tells about its media. Never select `data` here:
// the files are only sent by GET /tasks/:taskId/media/:kind
export const taskMediaSelect = {
  media: { select: { kind: true, updatedAt: true } },
} as const;

type WithMedia = { media: { kind: MediaKind; updatedAt: Date }[] };

export const withTaskMedia = <T extends WithMedia>(task: T) => ({
  ...task,
  media: task.media.map((m) => ({
    kind: fromMediaKind(m.kind),
    updatedAt: m.updatedAt,
  })),
});
