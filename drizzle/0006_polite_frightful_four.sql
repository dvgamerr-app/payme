ALTER TABLE `sessions` ADD `token` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_token` ON `sessions` (`token`);--> statement-breakpoint
ALTER TABLE `user_settings` ADD `payday` text DEFAULT 'end' NOT NULL;