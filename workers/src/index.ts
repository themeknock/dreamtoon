import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { AppContext, Env } from "./env";
import { sessionMiddleware } from "./middleware/session";
import { dreamRoutes } from "./routes/dream";
import { comicRoutes } from "./routes/comic";
import { galleryRoutes } from "./routes/gallery";
import { stripeRoutes } from "./routes/stripe";
import { authRoutes } from "./routes/auth";
import { dailyCleanup } from "./cron/cleanup";

const app = new Hono<AppContext>();

app.use("*", logger());

// Public free demo: anonymous (IP-based limits, no cookies). Use wide-open
// CORS with NO credentials — this is the most robust setup and removes the
// "Failed to fetch" surface that credentials:include creates on any response
// that's missing the exact ACAO+ACAC pair (cold starts, edge errors, etc).
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/*", sessionMiddleware);

app.get("/healthz", (c) =>
  c.json({ ok: true, env: c.env.ENV, ts: Date.now() }),
);

app.route("/api/dream", dreamRoutes);
app.route("/api/comic", comicRoutes);
app.route("/api/gallery", galleryRoutes);
app.route("/api/stripe", stripeRoutes);
app.route("/api/auth", authRoutes);

app.notFound((c) => {
  c.header("Access-Control-Allow-Origin", "*");
  return c.json({ error: "not_found" }, 404);
});
app.onError((err, c) => {
  console.error("unhandled", err);
  // Always include CORS so the browser surfaces the error instead of a
  // generic "Failed to fetch".
  c.header("Access-Control-Allow-Origin", "*");
  return c.json({ error: "internal_error" }, 500);
});

export default {
  fetch: app.fetch,
  scheduled: async (
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    ctx.waitUntil(dailyCleanup(env));
  },
} satisfies ExportedHandler<Env>;
