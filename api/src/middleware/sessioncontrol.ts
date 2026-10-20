import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth.ts";
import { db } from "../lib/prisma.ts";

export type SessionEnv = {
  Variables: { member: { id: number; isAdmin: boolean } };
};

export const sessionControl = (requireAdmin = false) =>
  createMiddleware<SessionEnv>(async (c, next) => {
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

    // Expose the member to the route handler as c.var.member.
    c.set("member", member);

    // Continue to the route handler.
    await next();
  });

export type UserEnv = {
  Variables: { user: typeof auth.$Infer.Session.user };
};

// For routes without a :householdId, e.g. listing the user's own households
export const requireSession = () =>
  createMiddleware<UserEnv>(async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    await next();
  });
