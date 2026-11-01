CREATE TYPE "public"."order_status" AS ENUM('draft', 'lyrics_ready', 'pending_payment', 'paid', 'generating', 'delivered', 'payment_failed', 'generation_failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_channel" AS ENUM('mtn', 'orange', 'card', 'manual');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'successful', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."song_status" AS ENUM('queued', 'generating', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_type_check" CHECK ("events"."type" in ('form_started', 'lyrics_generated', 'payment_started', 'payment_succeeded'))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_code" text NOT NULL,
	"whatsapp_phone" text NOT NULL,
	"occasion" text NOT NULL,
	"recipient_name" text NOT NULL,
	"relation" text,
	"sender_name" text,
	"anecdotes" text,
	"style_id" text NOT NULL,
	"chorus_language" text DEFAULT 'fr' NOT NULL,
	"voice" text DEFAULT 'male' NOT NULL,
	"title" text,
	"lyrics" text,
	"rewrite_count" integer DEFAULT 0 NOT NULL,
	"free_regen_used" boolean DEFAULT false NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"price_xaf" integer DEFAULT 3000 NOT NULL,
	"country" text DEFAULT 'CM' NOT NULL,
	"moderation_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_public_code_unique" UNIQUE("public_code"),
	CONSTRAINT "orders_voice_check" CHECK ("orders"."voice" in ('male', 'female'))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'tranzak' NOT NULL,
	"provider_request_id" text,
	"merchant_ref" text NOT NULL,
	"amount_xaf" integer NOT NULL,
	"channel" "payment_channel" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"raw_notification" jsonb,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_request_id_unique" UNIQUE("provider_request_id"),
	CONSTRAINT "payments_merchant_ref_unique" UNIQUE("merchant_ref")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"generation" integer DEFAULT 1 NOT NULL,
	"storage_path" text,
	"duration_seconds" integer,
	"status" "song_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "songs_order_version_generation_key" UNIQUE("order_id","version","generation"),
	CONSTRAINT "songs_version_check" CHECK ("songs"."version" in (1, 2))
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_type_created_at_idx" ON "events" USING btree ("type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_status_created_at_idx" ON "orders" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "songs_order_id_idx" ON "songs" USING btree ("order_id");