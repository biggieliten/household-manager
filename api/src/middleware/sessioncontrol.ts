import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth.ts";
import { db } from "../lib/prisma.ts";

export const sessionControl = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const householdId = Number(c.req.param("householdId"));
  if (!Number.isSafeInteger(householdId) || householdId <= 0) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const member = await db.member.findFirst({
    where: { userId: session.user.id, householdId, leftAt: null },
    select: { id: true },
  });

  if (!member) {
    return c.json({ error: "Forbidden" }, 403);
  }
  // TODO: Kontrollera Member.isAdmin för funktioner som kräver ägarbehörighet.
  // TODO: Använd kontrollerna i befintliga endpoints för sysslor och statistik.

  // Continue to the route handler.
  await next();
});
