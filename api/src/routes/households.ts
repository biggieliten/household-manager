import { Hono } from "hono";
import { householdIdParamSchema } from "../../../shared/schemas/household-schema.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";
import { sessionControl } from "../middleware/sessioncontrol.ts";

const app = new Hono().get(
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
);

export default app;
