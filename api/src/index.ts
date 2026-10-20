import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { ApplyGlobalResponse } from "hono/client";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "./lib/auth.ts";
import completions from "./routes/completions.ts";
import households from "./routes/households.ts";
import statistics from "./routes/statistics.ts";
import tasks from "./routes/tasks.ts";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.on(["POST", "GET", "PUT", "DELETE"], "/api/auth/*", (c) =>
  auth.handler(c.req.raw),
);

// Keeps the { error } shape for errors thrown outside route handlers,
// e.g. malformed JSON bodies rejected by the validator
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

const v1 = new Hono()
  .route("/households", households)
  .route("/households", tasks)
  .route("/households", completions)
  .route("/households", statistics);

const routes = app.route("/api/v1", v1);

type ErrorBody = { error: string };

// Adds the responses produced by app.onError to every route's client types
export type AppType = ApplyGlobalResponse<
  typeof routes,
  { 400: { json: ErrorBody }; 500: { json: ErrorBody } }
>;

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
