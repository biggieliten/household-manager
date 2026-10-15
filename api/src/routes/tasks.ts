import { Hono } from "hono";
import { db } from "../lib/prisma.ts";
const tasks = new Hono();

tasks.post("/households/:householdId/tasks", async (c) => {
  const householdId = Number(c.req.param("householdId"));
  if (!Number.isInteger(householdId)) {
    return c.json({ error: "householdId must be a number" }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Body must be valid JSON" }, 400);
  }

  const { name, description, frequency, difficultyLevel } = body;

  if (typeof name !== "string" || name.trim() === "") {
    return c.json({ error: "name is required" }, 400);
  }
  if (typeof description !== "string") {
    return c.json({ error: "description must be a string" }, 400);
  }
  if (!Number.isInteger(frequency) || frequency < 0) {
    return c.json({ error: "frequency must be 0 or a positive integer" }, 400);
  }
  if (!Number.isInteger(difficultyLevel) || difficultyLevel < 1) {
    return c.json({ error: "difficultyLevel must be a positive integer" }, 400);
  }

  const household = await db.household.findUnique({
    where: { id: householdId },
  });
  if (!household) {
    return c.json({ error: "Household not found" }, 404);
  }

  const task = await db.task.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      frequency,
      difficultyLevel,
      householdId,
    },
  });

  return c.json(task, 201);
});

export default tasks;
