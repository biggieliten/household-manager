import { Hono } from "hono";
import z from "zod";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import {
  createTaskBodySchema,
  updateTaskSchema,
} from "../../../shared/schemas/task-schema.ts";
import { mapDbError } from "../lib/db-errors.ts";
import { db } from "../lib/prisma.ts";
import { taskMediaSelect, withTaskMedia } from "../lib/task-media.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const taskIdParamSchema = householdIdParamSchema.extend({
  taskId: z.coerce.number<string>().int().nonnegative(),
});

const app = new Hono()
  .get(
    "/:householdId/tasks",
    sessionControl(),
    validate("param", householdIdParamSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const household = await db.household
        .findUniqueOrThrow({
          where: { id: householdId },
          select: {
            tasks: {
              where: { isArchived: false, deletedAt: null },
              orderBy: { id: "asc" },
              include: {
                ...taskMediaSelect,
                completedTasks: {
                  where: { deletedAt: null },
                  orderBy: { completedAt: "desc" },
                  select: {
                    completedAt: true,
                    member: {
                      select: { id: true, nickname: true, avatar: true },
                    },
                  },
                },
              },
            },
          },
        })
        .catch(mapDbError({ P2025: "Household not found" }));

      return c.json(household.tasks.map(withTaskMedia), 200);
    },
  )
  .get(
    "/:householdId/tasks/:taskId",
    sessionControl(),
    validate("param", taskIdParamSchema),
    async (c) => {
      const { householdId, taskId } = c.req.valid("param");
      const task = await db.task
        .findFirstOrThrow({
          where: { id: taskId, householdId, deletedAt: null },
          include: taskMediaSelect,
        })
        .catch(mapDbError({ P2025: "Task not found" }));

      return c.json(withTaskMedia(task), 200);
    },
  )
  .post(
    "/:householdId/tasks",
    sessionControl(),
    validate("param", householdIdParamSchema),
    validate("json", createTaskBodySchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const body = c.req.valid("json");

      const task = await db.task.create({
        data: { ...body, householdId },
        include: taskMediaSelect,
      });

      return c.json(withTaskMedia(task), 201);
    },
  )
  .patch(
    "/:householdId/tasks/:taskId/archive",
    sessionControl(true),
    validate("param", taskIdParamSchema),
    async (c) => {
      const { householdId, taskId } = c.req.valid("param");

      const task = await db.task
        .update({
          where: { id: taskId, householdId, deletedAt: null },
          data: { isArchived: true },
          include: taskMediaSelect,
        })
        .catch(mapDbError({ P2025: "Task not found" }));

      return c.json(withTaskMedia(task), 200);
    },
  )
  .patch(
    "/:householdId/tasks/:taskId",
    sessionControl(true),
    validate("param", taskIdParamSchema),
    validate("json", updateTaskSchema),
    async (c) => {
      const { householdId, taskId } = c.req.valid("param");
      const body = c.req.valid("json");

      const task = await db.task
        .update({
          where: { id: taskId, householdId, deletedAt: null },
          data: body,
          include: taskMediaSelect,
        })
        .catch(mapDbError({ P2025: "Task not found" }));

      return c.json(withTaskMedia(task), 200);
    },
  )
  .delete(
    "/:householdId/tasks/:taskId",
    sessionControl(true),
    validate("param", taskIdParamSchema),
    async (c) => {
      const { householdId, taskId } = c.req.valid("param");

      await db.task
        .delete({ where: { id: taskId, householdId, deletedAt: null } })
        .catch(mapDbError({ P2025: "Task not found" }));

      return c.body(null, 204);
    },
  );

export default app;
