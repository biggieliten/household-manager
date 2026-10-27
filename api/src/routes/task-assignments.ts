import { Hono } from "hono";
import z from "zod";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import { memberToTaskSchema } from "../../../shared/schemas/member-to-task-schema.ts";
import { mapDbError } from "../lib/db-errors.ts";
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
        where: { householdId, deletedAt: null },
        orderBy: { id: "asc" },
        include: {
          memberToTaskGroups: { select: { memberId: true } },
          taskToTaskGroups: {
            where: { task: { deletedAt: null, isArchived: false } },
            select: { task: { select: { id: true } } },
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
          tasks: group.taskToTaskGroups.map((link) => link.task),
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

      await db.task
        .findFirstOrThrow({
          where: {
            id: taskId,
            householdId,
            deletedAt: null,
            isArchived: false,
          },
          select: { id: true },
        })
        .catch(mapDbError({ P2025: "Task not found" }));

      await db.member
        .findFirstOrThrow({
          where: { id: memberId, householdId, leftAt: null },
          select: { id: true },
        })
        .catch(mapDbError({ P2025: "Member not found" }));

      const assignment = await db.memberToTask
        .create({ data: { memberId, taskId } })
        .catch(
          mapDbError({
            P2002: "Assignment already exists",
            P2003: "Task or member not found",
          }),
        );
      return c.json(assignment, 201);
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
