import { Hono } from "hono";
import z from "zod";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import { taskGroupBodySchema } from "../../../shared/schemas/task-group-schema.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import { mapDbError } from "../lib/db-errors.ts";
import { db } from "../lib/prisma.ts";
import { getRotationMemberId } from "../lib/task-rotation.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const groupParamSchema = householdIdParamSchema.extend({
  groupId: z.coerce.number<string>().int().positive(),
});

const groupInclude = {
  taskToTaskGroups: { select: { taskId: true }, orderBy: { taskId: "asc" } },
  memberToTaskGroups: {
    where: { member: { leftAt: null } },
    orderBy: { memberId: "asc" },
    include: {
      member: {
        select: {
          id: true,
          pauses: {
            where: { endDate: null, deletedAt: null },
            select: { id: true },
          },
        },
      },
    },
  },
} satisfies Prisma.TaskGroupInclude;

type GroupWithMembers = Prisma.TaskGroupGetPayload<{
  include: typeof groupInclude;
}>;

function toResponse(group: GroupWithMembers) {
  const memberIds = group.memberToTaskGroups.map((link) => link.memberId);
  const currentMemberId = getRotationMemberId(
    { ...group, memberIds },
    group.memberToTaskGroups.map(({ member }) => ({
      id: member.id,
      isPaused: member.pauses.length > 0,
    })),
    new Date(),
  );
  return {
    id: group.id,
    householdId: group.householdId,
    name: group.name,
    intervalDays: group.intervalDays,
    startDate: group.startDate.toISOString().slice(0, 10),
    taskIds: group.taskToTaskGroups.map((link) => link.taskId),
    memberIds,
    currentMemberId,
  };
}

const app = new Hono()
  .get(
    "/:householdId/task-groups",
    sessionControl(),
    validate("param", householdIdParamSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const groups = await db.taskGroup.findMany({
        where: { householdId, deletedAt: null },
        orderBy: { id: "asc" },
        include: groupInclude,
      });
      return c.json(groups.map(toResponse), 200);
    },
  )
  .post(
    "/:householdId/task-groups",
    sessionControl(true),
    validate("param", householdIdParamSchema),
    validate("json", taskGroupBodySchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const {
        taskIds: selectedIds,
        memberIds: selectedMemberIds,
        startDate,
        ...body
      } = c.req.valid("json");
      const taskIds = [...new Set(selectedIds)];
      const tasks = await db.task.findMany({
        where: {
          id: { in: taskIds },
          householdId,
          deletedAt: null,
          isArchived: false,
        },
        select: { id: true },
      });
      if (tasks.length !== taskIds.length) {
        return c.json(
          { error: "Välj tillgängliga sysslor i hushållet." },
          400,
        );
      }

      const memberIds = [...new Set(selectedMemberIds)];
      const members = await db.member.findMany({
        where: { id: { in: memberIds }, householdId, leftAt: null },
        select: { id: true },
      });
      if (members.length !== memberIds.length) {
        return c.json({ error: "Välj medlemmar som är kvar i hushållet." }, 400);
      }

      const group = await db.taskGroup.create({
        data: {
          ...body,
          householdId,
          startDate: new Date(`${startDate}T00:00:00.000Z`),
          taskToTaskGroups: {
            create: tasks.map((task) => ({ taskId: task.id })),
          },
          memberToTaskGroups: {
            create: members.map((member) => ({ memberId: member.id })),
          },
        },
        include: groupInclude,
      });
      return c.json(toResponse(group), 201);
    },
  )
  .patch(
    "/:householdId/task-groups/:groupId",
    sessionControl(true),
    validate("param", groupParamSchema),
    validate("json", taskGroupBodySchema),
    async (c) => {
      const { householdId, groupId } = c.req.valid("param");
      const {
        taskIds: selectedIds,
        memberIds: selectedMemberIds,
        startDate,
        ...body
      } = c.req.valid("json");
      const taskIds = [...new Set(selectedIds)];
      const tasks = await db.task.findMany({
        where: {
          id: { in: taskIds },
          householdId,
          deletedAt: null,
          isArchived: false,
        },
        select: { id: true },
      });
      if (tasks.length !== taskIds.length) {
        return c.json(
          { error: "Välj tillgängliga sysslor i hushållet." },
          400,
        );
      }

      const memberIds = [...new Set(selectedMemberIds)];
      const members = await db.member.findMany({
        where: { id: { in: memberIds }, householdId, leftAt: null },
        select: { id: true },
      });
      if (members.length !== memberIds.length) {
        return c.json({ error: "Välj medlemmar som är kvar i hushållet." }, 400);
      }

      const group = await db.taskGroup
        .update({
          where: { id: groupId, householdId, deletedAt: null },
          data: {
            ...body,
            startDate: new Date(`${startDate}T00:00:00.000Z`),
            taskToTaskGroups: {
              deleteMany: {},
              create: tasks.map((task) => ({ taskId: task.id })),
            },
            memberToTaskGroups: {
              deleteMany: {},
              create: members.map((member) => ({ memberId: member.id })),
            },
          },
          include: groupInclude,
        })
        .catch(mapDbError({ P2025: "Gruppen hittades inte." }));
      return c.json(toResponse(group), 200);
    },
  )
  .delete(
    "/:householdId/task-groups/:groupId",
    sessionControl(true),
    validate("param", groupParamSchema),
    async (c) => {
      const { householdId, groupId } = c.req.valid("param");
      const result = await db.taskGroup.updateMany({
        where: { id: groupId, householdId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (result.count === 0) {
        return c.json({ error: "Gruppen hittades inte." }, 404);
      }

      return c.json({ id: groupId }, 200);
    },
  );

export default app;
