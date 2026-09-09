DO $$ BEGIN
  CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'paid', 'assigned', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN
  -- add missing values to the existing enum
  ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'paid';
  ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'assigned';
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."trip_mode" AS ENUM('pickup', 'drop');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."vehicle_type" AS ENUM('sedan', 'suv');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"confirmation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"trip_mode" "trip_mode" NOT NULL,
	"pickup_location" text NOT NULL,
	"drop_location" text NOT NULL,
	"pickup_airport" text,
	"drop_airport" text,
	"pickup_address" text,
	"drop_address" text,
	"pickup_address_place_id" text,
	"drop_address_place_id" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"meridiem" text NOT NULL,
	"passenger_count" integer NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"vehicle_label" text NOT NULL,
	"route_distance_meters" integer NOT NULL,
	"route_distance_text" text NOT NULL,
	"route_duration_text" text NOT NULL,
	"total_fare_cents" integer NOT NULL,
	"driver_name" text,
	"driver_assigned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_confirmation_id_unique" UNIQUE("confirmation_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;