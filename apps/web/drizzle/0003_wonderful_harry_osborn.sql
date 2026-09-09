CREATE TYPE "public"."driver_status" AS ENUM('available', 'busy', 'offline');--> statement-breakpoint
CREATE TABLE "driver" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"license_number" text NOT NULL,
	"registration_number" text NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"vehicle_label" text NOT NULL,
	"insurance_policy_number" text NOT NULL,
	"insurance_expiry_date" text NOT NULL,
	"profile_image" text,
	"status" "driver_status" DEFAULT 'available' NOT NULL,
	"home_city" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "driver_email_unique" UNIQUE("email"),
	CONSTRAINT "driver_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "driver_license_number_unique" UNIQUE("license_number"),
	CONSTRAINT "driver_registration_number_unique" UNIQUE("registration_number")
);
