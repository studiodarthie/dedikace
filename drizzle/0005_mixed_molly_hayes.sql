CREATE TYPE "public"."video_status" AS ENUM('queued', 'rendering', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "video_status" DEFAULT 'queued' NOT NULL,
	"photo_key" text NOT NULL,
	"video_key" text,
	"renders" integer DEFAULT 1 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;