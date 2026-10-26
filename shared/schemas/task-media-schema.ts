import z from "zod";
import { householdIdParamSchema } from "./household-schema.ts";

// A task can hold one image and one voice note, addressed as /media/image and /media/audio
export const taskMediaKindSchema = z.enum(["image", "audio"]);

export const taskMediaParamSchema = householdIdParamSchema.extend({
  taskId: z.coerce.number<string>().int().nonnegative(),
  kind: taskMediaKindSchema,
});

const MAX_BYTES = 5 * 1024 * 1024;

// Shared with the app so it can check a file before uploading it
export const TASK_MEDIA_RULES = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: MAX_BYTES,
  },
  audio: {
    mimeTypes: ["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac"],
    maxBytes: MAX_BYTES,
  },
} as const satisfies Record<
  TaskMediaKind,
  { mimeTypes: readonly string[]; maxBytes: number }
>;

export const uploadTaskMediaFormSchema = z.object({
  file: z.instanceof(File),
});

export const responseTaskMediaSchema = z.object({
  kind: taskMediaKindSchema,
  mimeType: z.string(),
  size: z.int(),
  updatedAt: z.coerce.date(),
});

export type TaskMediaKind = z.infer<typeof taskMediaKindSchema>;
export type TaskMedia = z.infer<typeof responseTaskMediaSchema>;
