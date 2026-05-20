import { Hono } from "hono";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import type { AppContext } from "../env";
import { db } from "../db/client";
import { users } from "../db/schema";

export const stripeRoutes = new Hono<AppContext>();

function stripe(env: AppContext["Bindings"]): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

stripeRoutes.post("/checkout", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "auth_required" }, 401);

  const user = await db(c.env)
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (!user) return c.json({ error: "user_not_found" }, 404);

  const sc = stripe(c.env);

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await sc.customers.create({
      email: user.email,
      metadata: { userId },
    });
    customerId = customer.id;
    await db(c.env)
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  const session = await sc.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: c.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${c.env.PUBLIC_APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${c.env.PUBLIC_APP_URL}/upgrade`,
    allow_promotion_codes: true,
  });

  return c.json({ url: session.url });
});

stripeRoutes.post("/portal", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "auth_required" }, 401);

  const user = await db(c.env)
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (!user?.stripeCustomerId) return c.json({ error: "no_customer" }, 404);

  const sc = stripe(c.env);
  const session = await sc.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${c.env.PUBLIC_APP_URL}/upgrade`,
  });
  return c.json({ url: session.url });
});

stripeRoutes.post("/webhook", async (c) => {
  const sc = stripe(c.env);
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.text("missing signature", 400);

  const body = await c.req.text();
  let event: Stripe.Event;
  try {
    event = await sc.webhooks.constructEventAsync(
      body,
      sig,
      c.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("stripe_webhook_bad_sig", String(err));
    return c.text("bad signature", 400);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const active = sub.status === "active" || sub.status === "trialing";
      await db(c.env)
        .update(users)
        .set({ plan: active ? "pro" : "free" })
        .where(eq(users.stripeCustomerId, customerId));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await db(c.env)
        .update(users)
        .set({ plan: "free" })
        .where(eq(users.stripeCustomerId, customerId));
      break;
    }
  }

  return c.text("ok");
});
