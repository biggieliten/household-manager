import { createMiddleware } from "hono/factory";

export const sessionControl = createMiddleware(async (c, next) => {
  // TODO: Fetch the Better Auth session using c.req.raw.headers.

  // TODO: Return 401 if there is no session.

  // Continue to the route handler.
  await next();
});
