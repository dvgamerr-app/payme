ALTER TABLE "budget_categories" DROP CONSTRAINT "budget_categories_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_categories" DROP COLUMN "user_id";