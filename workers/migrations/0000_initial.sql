CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `plan` text DEFAULT 'free' NOT NULL,
  `stripe_customer_id` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

CREATE TABLE `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);

CREATE TABLE `magic_links` (
  `token` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `expires_at` integer NOT NULL,
  `consumed_at` integer
);

CREATE TABLE `dreams` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text,
  `audio_r2_key` text NOT NULL,
  `transcript` text NOT NULL,
  `ip_hash` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `dreams_ip_idx` ON `dreams` (`ip_hash`,`created_at`);

CREATE TABLE `comics` (
  `id` text PRIMARY KEY NOT NULL,
  `dream_id` text NOT NULL,
  `final_image_r2_key` text NOT NULL,
  `panel1_r2_key` text NOT NULL,
  `panel2_r2_key` text NOT NULL,
  `panel3_r2_key` text NOT NULL,
  `panel4_r2_key` text NOT NULL,
  `style` text DEFAULT 'watercolor' NOT NULL,
  `character_sheet` text,
  `share_count` integer DEFAULT 0 NOT NULL,
  `view_count` integer DEFAULT 0 NOT NULL,
  `gallery` integer DEFAULT false NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`dream_id`) REFERENCES `dreams`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `comics_gallery_idx` ON `comics` (`gallery`,`created_at`);
CREATE INDEX `comics_dream_idx` ON `comics` (`dream_id`);

CREATE TABLE `usage` (
  `actor_id` text NOT NULL,
  `day` text NOT NULL,
  `comic_count` integer DEFAULT 0 NOT NULL,
  PRIMARY KEY(`actor_id`, `day`)
);

CREATE TABLE `refusals` (
  `id` text PRIMARY KEY NOT NULL,
  `transcript_hash` text NOT NULL,
  `layer` integer NOT NULL,
  `category` text NOT NULL,
  `panel_index` integer,
  `ip_hash` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE TABLE `gallery_top` (
  `rank` integer PRIMARY KEY NOT NULL,
  `comic_id` text NOT NULL,
  `score` integer NOT NULL,
  `refreshed_at` integer NOT NULL,
  FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON UPDATE no action ON DELETE cascade
);
