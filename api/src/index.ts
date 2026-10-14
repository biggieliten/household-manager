import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth.ts";
const app = new Hono();

app.on(["POST", "GET", "PUT", "DELETE"], "/api/auth/*", (c) =>
  auth.handler(c.req.raw),
);

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

export default app;
