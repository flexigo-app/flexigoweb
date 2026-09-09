CREATE TABLE "pricing_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_commission_bps" integer DEFAULT 2000 NOT NULL,
	"booking_fee_cents" integer DEFAULT 250 NOT NULL,
	"airport_access_fee_cents" integer DEFAULT 0 NOT NULL,
	"tax_rate_bps" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "pricing_policy" (
	"id", "platform_commission_bps", "booking_fee_cents", "airport_access_fee_cents", "tax_rate_bps"
) VALUES ('default', 2000, 250, 0, 0);
--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "trip_fare_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "booking_fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "airport_access_fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "tax_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "platform_commission_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "driver_payout_cents" integer DEFAULT 0 NOT NULL;