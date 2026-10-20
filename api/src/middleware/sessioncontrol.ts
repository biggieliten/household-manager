import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth.ts";
import { db } from "../lib/prisma.ts";

// For routes without a :householdId, e.g. listing the user's own households
export const requireSession = () =>
  createMiddleware<{ Variables: { user: typeof auth.$Infer.Session.user } }>(
    async (c, next) => {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      c.set("user", session.user);
      await next();
    },
  );

export const sessionControl = (requireAdmin = false) =>
  createMiddleware(async (c, next) => {
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
      select: { id: true, isAdmin: true },
    });

    if (!member) {
      return c.json({ error: "Forbidden" }, 403);
    }
    if (requireAdmin && !member.isAdmin) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Continue to the route handler.
    await next();
  });
