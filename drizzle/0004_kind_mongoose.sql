ALTER TABLE "orders" ADD COLUMN "reminded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reminder_emailed_at" timestamp with time zone;