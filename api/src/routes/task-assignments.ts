import { Hono } from "hono";
import z from "zod";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import { memberToTaskSchema } from "../../../shared/schemas/member-to-task-schema.ts";
import { Prisma } from "../generated/prisma/client.ts";
import { db } from "../lib/prisma.ts";
import { combineTaskAssignments } from "../lib/task-rotation.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const assignmentParamSchema = householdIdParamSchema.extend({
  taskId: z.coerce.number<string>().pipe(memberToTaskSchema.shape.taskId),
  memberId: z.coerce.number<string>().pipe(memberToTaskSchema.shape.memberId),
});

const app = new Hono()
  .get(
    "/:householdId/task-assignments",
    sessionControl(),
    validate("param", householdIdParamSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");

      const assignments = await db.memberToTask.findMany({
        where: {
          task: { householdId, deletedAt: null, isArchived: false },
          member: { householdId, leftAt: null },
        },
        orderBy: [{ taskId: "asc" }, { memberId: "asc" }],
      });

      const groups = await db.taskGroup.findMany({
        where: { householdId },
        include: {
          memberToTaskGroups: { select: { memberId: true } },
          tasks: {
            where: { deletedAt: null, isArchived: false },
            select: { id: true },
          },
        },
      });
      const members = await db.member.findMany({
        where: { householdId, leftAt: null },
        select: {
          id: true,
          pauses: {
            where: { endDate: null, deletedAt: null },
            select: { id: true },
          },
        },
      });
      const currentAssignments = combineTaskAssignments(
        assignments,
        groups.map((group) => ({
          ...group,
          memberIds: group.memberToTaskGroups.map((link) => link.memberId),
        })),
        members.map((member) => ({
          id: member.id,
          isPaused: member.pauses.length > 0,
        })),
        new Date(),
      );

      return c.json(currentAssignments, 200);
    },
  )
  .post(
    "/:householdId/task-assignments",
    sessionControl(true),
    validate("param", householdIdParamSchema),
    validate("json", memberToTaskSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const { memberId, taskId } = c.req.valid("json");

      const task = await db.task.findFirst({
        where: { id: taskId, householdId, deletedAt: null, isArchived: false },
        select: { id: true },
      });
      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }

      const member = await db.member.findFirst({
        where: { id: memberId, householdId, leftAt: null },
        select: { id: true },
      });
      if (!member) {
        return c.json({ error: "Member not found" }, 404);
      }

      try {
        const assignment = await db.memberToTask.create({
          data: { memberId, taskId },
        });
        return c.json(assignment, 201);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            return c.json({ error: "Assignment already exists" }, 409);
          }
          if (error.code === "P2003") {
            return c.json({ error: "Task or member not found" }, 404);
          }
        }
        throw error;
      }
    },
  )
  .delete(
    "/:householdId/task-assignments/:taskId/:memberId",
    sessionControl(true),
    validate("param", assignmentParamSchema),
    async (c) => {
      const { householdId, taskId, memberId } = c.req.valid("param");
      const result = await db.memberToTask.deleteMany({
        where: {
          memberId,
          taskId,
          task: {
            householdId,
            household: { deletedAt: null },
            deletedAt: null,
            isArchived: false,
          },
          member: { householdId, leftAt: null },
        },
      });
      if (result.count === 0) {
        return c.json({ error: "Assignment not found" }, 404);
      }

      return c.json({ memberId, taskId }, 200);
    },
  );

export default app;
