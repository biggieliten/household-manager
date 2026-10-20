import { Hono } from "hono";
import { db } from "../lib/prisma.ts";
import { requireSession } from "../middleware/sessioncontrol.ts";

// Households the signed-in user is an active member of, with their own membership
const app = new Hono().get("/", requireSession(), async (c) => {
  const user = c.get("user");

  const members = await db.member.findMany({
    where: {
      userId: user.id,
      leftAt: null,
      household: { deletedAt: null },
    },
    orderBy: { householdId: "asc" },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      isAdmin: true,
      household: { select: { id: true, name: true, accessCode: true } },
    },
  });

  return c.json(
    members.map(({ household, ...member }) => ({ ...household, member })),
    200,
  );
});

export default app;
