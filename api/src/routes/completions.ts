import { Hono } from "hono";
import { completionParamSchema } from "../../../shared/schemas/completed-task-schema.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const app = new Hono().post(
  "/:householdId/tasks/:taskId/completions",
  sessionControl(),
  validate("param", completionParamSchema),
  async (c) => {
    const { householdId, taskId } = c.req.valid("param");
    const { member } = c.var;

    const task = await db.task.findFirst({
      where: { id: taskId, householdId, isArchived: false, deletedAt: null },
      select: { id: true },
    });
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    const completedTask = await db.completedTask.create({
      data: {
        taskId: task.id,
        memberId: member.id,
        completedAt: new Date(),
      },
      select: {
        id: true,
        taskId: true,
        memberId: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return c.json(completedTask, 201);
  },
);

export default app;
