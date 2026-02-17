CREATE TABLE "fixed_months" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"month_id" integer NOT NULL,
	"name" text NOT NULL,
	"amount" double precision NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fixed_expenses" ADD COLUMN "currency" text DEFAULT 'THB' NOT NULL;--> statement-breakpoint
ALTER TABLE "fixed_expenses" ADD COLUMN "exchange_rate" double precision DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "fixed_expenses" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "income_entries" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "payday" text DEFAULT 'end' NOT NULL;--> statement-breakpoint
ALTER TABLE "fixed_months" ADD CONSTRAINT "fixed_months_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_months" ADD CONSTRAINT "fixed_months_month_id_months_id_fk" FOREIGN KEY ("month_id") REFERENCES "public"."months"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fixed_months_user_month" ON "fixed_months" USING btree ("user_id","month_id");--> statement-breakpoint
CREATE INDEX "idx_fixed_months_month" ON "fixed_months" USING btree ("month_id");