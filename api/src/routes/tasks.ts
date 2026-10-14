import { Hono } from "hono";

const tasks = new Hono();

tasks.post("/households/:householdId/tasks", async (c) => {
  const householdId = c.req.param("householdId");
  return c.json({ message: "Route works", householdId });
});

export default tasks;
