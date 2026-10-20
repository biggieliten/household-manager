import { Hono } from "hono";
import {
  householdIdParamSchema,
  memberIdParamSchema,
} from "../../../shared/schemas/household-schema.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const app = new Hono()
  .get(
    "/:householdId",
    sessionControl(),
    validate("param", householdIdParamSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const { member: me } = c.var;

      const household = await db.household.findUnique({
        where: { id: householdId },
        include: {
          members: {
            where: { leftAt: null },
            orderBy: { id: "asc" },
            select: {
              id: true,
              nickname: true,
              avatar: true,
              isAdmin: true,
              pauses: {
                where: { endDate: null, deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      });
      if (!household) {
        return c.json({ error: "Household not found" }, 404);
      }

      return c.json(
        {
          id: household.id,
          name: household.name,
          accessCode: household.accessCode,
          members: household.members.map(({ pauses, ...member }) => ({
            ...member,
            isMe: member.id === me.id,
            isPaused: pauses.length > 0,
          })),
        },
        200,
      );
    },
  )
  .post(
    "/:householdId/members/:memberId/pause",
    sessionControl(true),
    validate("param", memberIdParamSchema),
    async (c) => {
      const { householdId, memberId } = c.req.valid("param");

      const member = await db.member.findFirst({
        where: { id: memberId, householdId, leftAt: null },
        include: { pauses: { where: { endDate: null, deletedAt: null } } },
      });
      if (!member) {
        return c.json({ error: "Member not found" }, 404);
      }
      if (member.pauses.length > 0) {
        return c.json({ error: "Member is already paused" }, 409);
      }

      const pause = await db.pause.create({ data: { memberId } });

      return c.json(pause, 201);
    },
  );

export default app;
