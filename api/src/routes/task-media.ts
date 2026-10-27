import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  TASK_MEDIA_RULES,
  taskMediaParamSchema,
  uploadTaskMediaFormSchema,
} from "../../../shared/schemas/task-media-schema.ts";
import { mapDbError } from "../lib/db-errors.ts";
import { db } from "../lib/prisma.ts";
import { toMediaKind } from "../lib/task-media.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const findTask = (householdId: number, taskId: number) =>
  db.task
    .findFirstOrThrow({
      where: { id: taskId, householdId, deletedAt: null },
      select: { id: true },
    })
    .catch(mapDbError({ P2025: "Task not found" }));

// Reject oversized uploads before the body is read into memory.
// The extra 64 KB leaves room for the multipart boundaries and headers.
const maxUploadBytes =
  Math.max(TASK_MEDIA_RULES.image.maxBytes, TASK_MEDIA_RULES.audio.maxBytes) +
  64 * 1024;

const app = new Hono()
  .get(
    "/:householdId/tasks/:taskId/media/:kind",
    sessionControl(),
    validate("param", taskMediaParamSchema),
    async (c) => {
      const { householdId, taskId, kind } = c.req.valid("param");

      await findTask(householdId, taskId);

      const media = await db.taskMedia
        .findUniqueOrThrow({
          where: { taskId_kind: { taskId, kind: toMediaKind(kind) } },
          select: { data: true, mimeType: true },
        })
        .catch(mapDbError({ P2025: "Media not found" }));

      return c.body(media.data, 200, {
        "Content-Type": media.mimeType,
        // The app adds ?v=<updatedAt> to the URL, so a replaced file gets a new URL
        "Cache-Control": "private, max-age=31536000, immutable",
      });
    },
  )
  .put(
    "/:householdId/tasks/:taskId/media/:kind",
    sessionControl(),
    validate("param", taskMediaParamSchema),
    bodyLimit({
      maxSize: maxUploadBytes,
      onError: (c) => c.json({ error: "File is too large" }, 413),
    }),
    validate("form", uploadTaskMediaFormSchema),
    async (c) => {
      const { householdId, taskId, kind } = c.req.valid("param");
      const { file } = c.req.valid("form");
      const rules = TASK_MEDIA_RULES[kind];

      if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
        return c.json(
          {
            error: `Unsupported file type for ${kind}: ${file.type || "unknown"}`,
          },
          415,
        );
      }
      if (file.size === 0 || file.size > rules.maxBytes) {
        return c.json({ error: "File is empty or too large" }, 413);
      }

      await findTask(householdId, taskId);

      const fields = {
        mimeType: file.type,
        size: file.size,
        data: new Uint8Array(await file.arrayBuffer()),
      };

      // Replaces the existing image or voice note, if there is one
      const media = await db.taskMedia.upsert({
        where: { taskId_kind: { taskId, kind: toMediaKind(kind) } },
        create: { taskId, kind: toMediaKind(kind), ...fields },
        update: fields,
        select: { mimeType: true, size: true, updatedAt: true },
      });

      return c.json({ kind, ...media }, 200);
    },
  )
  .delete(
    "/:householdId/tasks/:taskId/media/:kind",
    sessionControl(),
    validate("param", taskMediaParamSchema),
    async (c) => {
      const { householdId, taskId, kind } = c.req.valid("param");

      await findTask(householdId, taskId);

      const { count } = await db.taskMedia.deleteMany({
        where: { taskId, kind: toMediaKind(kind) },
      });
      if (count === 0) {
        return c.json({ error: "Media not found" }, 404);
      }

      return c.body(null, 204);
    },
  );

export default app;
