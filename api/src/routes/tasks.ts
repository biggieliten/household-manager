import { Hono } from "hono";
import z from "zod";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import {
  createTaskBodySchema,
  updateTaskSchema,
} from "../../../shared/schemas/task-schema.ts";
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
      const household = await db.household.findUnique({
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
      });
      if (!household) {
        return c.json({ error: "Household not found" }, 404);
      }

      return c.json(household.tasks.map(withTaskMedia), 200);
    },
  )
  .get(
    "/:householdId/tasks/:taskId",
    sessionControl(),
    validate("param", taskIdParamSchema),
    async (c) => {
      const { householdId, taskId } = c.req.valid("param");
      const task = await db.task.findFirst({
        where: { id: taskId, householdId, deletedAt: null },
        include: taskMediaSelect,
      });
      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }

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

      const household = await db.household.findUnique({
        where: { id: householdId },
      });
      if (!household) {
        return c.json({ error: "Household not found" }, 404);
      }

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

      const existing = await db.task.findFirst({
        where: { id: taskId, householdId, deletedAt: null },
      });
      if (!existing) {
        return c.json({ error: "Task not found" }, 404);
      }

      const task = await db.task.update({
        where: { id: taskId },
        data: { isArchived: true },
        include: taskMediaSelect,
      });

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

      const existing = await db.task.findFirst({
        where: { id: taskId, householdId, deletedAt: null },
      });
      if (!existing) {
        return c.json({ error: "Task not found" }, 404);
      }

      const task = await db.task.update({
        where: { id: taskId },
        data: body,
        include: taskMediaSelect,
      });

      return c.json(withTaskMedia(task), 200);
    },
  )
  .delete(
    "/:householdId/tasks/:taskId",
    sessionControl(true),
    validate("param", taskIdParamSchema),
    async (c) => {
      const { householdId, taskId } = c.req.valid("param");

      const existing = await db.task.findFirst({
        where: { id: taskId, householdId, deletedAt: null },
      });
      if (!existing) {
        return c.json({ error: "Task not found" }, 404);
      }

      await db.task.delete({ where: { id: taskId } });

      return c.body(null, 204);
    },
  );

export default app;
