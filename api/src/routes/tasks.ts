import { Hono } from "hono";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import { createTaskBodySchema } from "../../../shared/schemas/task-schema.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";

const app = new Hono().post(
  "/:householdId/tasks",
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
    });

    return c.json(task, 201);
  },
);

export default app;
