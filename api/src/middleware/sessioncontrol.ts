import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth.ts";

export const sessionControl = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Continue to the route handler.
  await next();
});
