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

app.use(
  "/api/*",
  cors({
    // Public free demo: reflect any origin (rate-limited + anon, low risk).
    // Reflecting the specific origin (not literal "*") keeps credentials valid.
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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

app.notFound((c) => c.json({ error: "not_found" }, 404));
app.onError((err, c) => {
  console.error("unhandled", err);
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
