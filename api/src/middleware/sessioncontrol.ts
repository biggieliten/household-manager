import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth.ts";

export const sessionControl = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // TODO: Kontrollera att användaren är aktiv medlem i hushållet i URL:en, annars returnera 403.
  // TODO: Kontrollera Member.isAdmin för funktioner som kräver ägarbehörighet.
  // TODO: Använd kontrollerna i befintliga endpoints för sysslor och statistik.

  // Continue to the route handler.
  await next();
});
