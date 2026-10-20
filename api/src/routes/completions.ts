import { Hono } from "hono";
import { completionParamSchema } from "../../../shared/schemas/completed-task-schema.ts";
import { auth } from "../lib/auth.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const app = new Hono().post(
  "/:householdId/tasks/:taskId/completions",
  sessionControl(),
  validate("param", completionParamSchema),
  async (c) => {
    const { householdId, taskId } = c.req.valid("param");
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const member = await db.member.findFirst({
      where: { userId: session.user.id, householdId, leftAt: null },
      select: { id: true },
    });
    if (!member) {
      return c.json({ error: "Forbidden" }, 403);
    }

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
