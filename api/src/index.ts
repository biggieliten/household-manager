import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { auth } from "./lib/auth.ts";
import { db } from "./lib/prisma.ts";

const app = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.on(["POST", "GET", "PUT", "DELETE"], "/api/auth/*", (c) =>
  auth.handler(c.req.raw),
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Points = the task's difficultyLevel for every completion
app.get("/households/:id/statistics", async (c) => {
  const householdId = Number(c.req.param("id"));
  if (!Number.isInteger(householdId)) {
    return c.json({ error: "Invalid household id" }, 400);
  }

  const household = await db.household.findUnique({
    where: { id: householdId },
    include: {
      members: { orderBy: { id: "asc" } },
      tasks: {
        orderBy: { id: "asc" },
        include: { completedTasks: { select: { memberId: true } } },
      },
    },
  });
  if (!household) {
    return c.json({ error: "Household not found" }, 404);
  }

  const pointsPerMember = new Map<number, number>();
  const tasks = household.tasks
    .filter((task) => task.completedTasks.length > 0)
    .map((task) => {
      const taskPoints = new Map<number, number>();
      for (const { memberId } of task.completedTasks) {
        taskPoints.set(
          memberId,
          (taskPoints.get(memberId) ?? 0) + task.difficultyLevel,
        );
        pointsPerMember.set(
          memberId,
          (pointsPerMember.get(memberId) ?? 0) + task.difficultyLevel,
        );
      }
      return {
        id: task.id,
        name: task.name,
        count: task.completedTasks.length,
        taskPoints,
      };
    });

  // Members who have left are only shown if they earned points
  const members = household.members
    .map((member) => ({
      id: member.id,
      nickname: member.nickname,
      avatar: member.avatar,
      points: pointsPerMember.get(member.id) ?? 0,
      leftAt: member.leftAt,
    }))
    .filter((member) => !member.leftAt || member.points > 0)
    .map(({ leftAt, ...member }) => member);

  return c.json({
    totalPoints: members.reduce((sum, member) => sum + member.points, 0),
    members,
    tasks: tasks.map(({ taskPoints, ...task }) => ({
      ...task,
      pointsByMember: members.map((member) => taskPoints.get(member.id) ?? 0),
    })),
  });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

export default app;
