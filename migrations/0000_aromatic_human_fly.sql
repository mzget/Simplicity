CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` text,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`category_ids` text DEFAULT '[]' NOT NULL,
	`period` text DEFAULT 'month' NOT NULL,
	`start_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text DEFAULT '#6B7F8E' NOT NULL,
	`icon` text DEFAULT 'tag' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wallet_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`frequency` text NOT NULL,
	`start_date` text NOT NULL,
	`next_run_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_id` text NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`type` text DEFAULT 'REGULAR' NOT NULL,
	`transfer_type` text,
	`linked_transaction_id` text,
	`target_wallet_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`foreign_amount` real,
	`foreign_currency` text,
	`exchange_rate` real,
	`start_date` text NOT NULL,
	`note` text,
	`place` text,
	`hashtags` text DEFAULT '[]',
	`image_url` text,
	`is_pending` integer DEFAULT 0 NOT NULL,
	`recurring_rule_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`default_currency` text DEFAULT 'THB' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'cash' NOT NULL,
	`currency` text DEFAULT 'THB' NOT NULL,
	`starting_balance` real DEFAULT 0 NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`color` text DEFAULT '#12C48B' NOT NULL,
	`icon` text DEFAULT 'wallet' NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
