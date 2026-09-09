CREATE TYPE "public"."fleet_vehicle_status" AS ENUM('available', 'assigned', 'maintenance', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_mode" AS ENUM('driver_owned', 'flexigo_fleet');--> statement-breakpoint
CREATE TABLE "fleet_vehicle" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_config_id" text NOT NULL,
	"label" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"vin" text NOT NULL,
	"registration_number" text NOT NULL,
	"insurance_policy_number" text NOT NULL,
	"insurance_expiry_date" text NOT NULL,
	"status" "fleet_vehicle_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fleet_vehicle_vin_unique" UNIQUE("vin"),
	CONSTRAINT "fleet_vehicle_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
ALTER TABLE "driver" ALTER COLUMN "registration_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "driver" ALTER COLUMN "vehicle_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "driver" ALTER COLUMN "vehicle_label" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "driver" ALTER COLUMN "insurance_policy_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "driver" ALTER COLUMN "insurance_expiry_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "fulfillment_mode" "fulfillment_mode" DEFAULT 'driver_owned' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "fleet_driver_compensation_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "fuel_estimate_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "vehicle_reserve_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "payment_processing_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "flexigo_contribution_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "assigned_driver_id" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "assigned_fleet_vehicle_id" text;--> statement-breakpoint
ALTER TABLE "pricing_policy" ADD COLUMN "fleet_driver_trip_pay_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_policy" ADD COLUMN "fleet_driver_per_mile_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_policy" ADD COLUMN "fleet_fuel_cost_per_mile_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_policy" ADD COLUMN "fleet_vehicle_reserve_per_mile_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_policy" ADD COLUMN "payment_processing_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fleet_vehicle" ADD CONSTRAINT "fleet_vehicle_vehicle_config_id_vehicle_config_id_fk" FOREIGN KEY ("vehicle_config_id") REFERENCES "public"."vehicle_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_assigned_fleet_vehicle_id_fleet_vehicle_id_fk" FOREIGN KEY ("assigned_fleet_vehicle_id") REFERENCES "public"."fleet_vehicle"("id") ON DELETE no action ON UPDATE no action;