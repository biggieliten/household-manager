import { Hono } from "hono";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

// Points = the task's difficultyLevel for every completion
const app = new Hono().get(
  "/:householdId/statistics",
  sessionControl(),
  validate("param", householdIdParamSchema),
  async (c) => {
    const { householdId } = c.req.valid("param");

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

    return c.json(
      {
        totalPoints: members.reduce((sum, member) => sum + member.points, 0),
        members,
        tasks: tasks.map(({ taskPoints, ...task }) => ({
          ...task,
          pointsByMember: members.map(
            (member) => taskPoints.get(member.id) ?? 0,
          ),
        })),
      },
      200,
    );
  },
);

export default app;
