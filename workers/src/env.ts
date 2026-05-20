export type Env = {
  DB: D1Database;
  AUDIO_BUCKET: R2Bucket;
  PANELS_BUCKET: R2Bucket;
  COMICS_BUCKET: R2Bucket;
  RATE_LIMIT_KV: KVNamespace;
  AI: Ai;

  // LLM scene composer — OpenRouter (key is a wrangler secret, never in repo).
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;

  // Optional — only needed for paid tier + accounts. Anon free path works without.
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID: string;
  BETTER_AUTH_SECRET: string;
  RESEND_API_KEY: string;
  FAL_KEY: string;

  IP_HASH_SALT: string;

  ENV: "dev" | "staging" | "prod";
  CDN_DOMAIN: string;
  PUBLIC_APP_URL: string;
};

export type AppContext = {
  Bindings: Env;
  Variables: {
    userId: string | null;
    requestId: string;
  };
};
