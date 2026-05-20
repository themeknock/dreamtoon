import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
  }),
);

export const magicLinks = sqliteTable("magic_links", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp" }),
});

export const dreams = sqliteTable(
  "dreams",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    audioR2Key: text("audio_r2_key").notNull(),
    transcript: text("transcript").notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    ipIdx: index("dreams_ip_idx").on(t.ipHash, t.createdAt),
  }),
);

export const comics = sqliteTable(
  "comics",
  {
    id: text("id").primaryKey(),
    dreamId: text("dream_id")
      .notNull()
      .references(() => dreams.id, { onDelete: "cascade" }),
    finalImageR2Key: text("final_image_r2_key").notNull(),
    panel1R2Key: text("panel1_r2_key").notNull(),
    panel2R2Key: text("panel2_r2_key").notNull(),
    panel3R2Key: text("panel3_r2_key").notNull(),
    panel4R2Key: text("panel4_r2_key").notNull(),
    style: text("style", {
      enum: ["line-art", "oil", "pixel", "watercolor"],
    })
      .notNull()
      .default("watercolor"),
    characterSheet: text("character_sheet"),
    shareCount: integer("share_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    gallery: integer("gallery", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    galleryIdx: index("comics_gallery_idx").on(t.gallery, t.createdAt),
    dreamIdx: index("comics_dream_idx").on(t.dreamId),
  }),
);

export const usage = sqliteTable(
  "usage",
  {
    actorId: text("actor_id").notNull(),
    day: text("day").notNull(),
    comicCount: integer("comic_count").notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.actorId, t.day] }),
  }),
);

export const refusals = sqliteTable("refusals", {
  id: text("id").primaryKey(),
  transcriptHash: text("transcript_hash").notNull(),
  layer: integer("layer").notNull(),
  category: text("category").notNull(),
  panelIndex: integer("panel_index"),
  ipHash: text("ip_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const galleryTop = sqliteTable("gallery_top", {
  rank: integer("rank").primaryKey(),
  comicId: text("comic_id")
    .notNull()
    .references(() => comics.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  refreshedAt: integer("refreshed_at", { mode: "timestamp" }).notNull(),
});
