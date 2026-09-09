CREATE TABLE "vehicle_config" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_fare_cents" integer NOT NULL,
	"per_mile_cents" integer NOT NULL,
	"minimum_fare_cents" integer NOT NULL,
	"passenger_capacity" integer NOT NULL,
	"luggage_capacity" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_config_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "vehicle_config" (
	"id", "name", "base_fare_cents", "per_mile_cents", "minimum_fare_cents",
	"passenger_capacity", "luggage_capacity", "sort_order"
) VALUES
	('suv', 'SUV', 2500, 175, 6500, 6, 6, 10),
	('sedan', 'Sedan', 1500, 145, 4500, 3, 3, 20);
--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "vehicle_type" SET DATA TYPE text USING "vehicle_type"::text;--> statement-breakpoint
ALTER TABLE "driver" ALTER COLUMN "vehicle_type" SET DATA TYPE text USING "vehicle_type"::text;--> statement-breakpoint
DROP TYPE "public"."vehicle_type";