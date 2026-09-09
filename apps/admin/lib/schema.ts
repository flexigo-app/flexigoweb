import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "paid",
  "assigned",
  "completed",
  "cancelled",
]);

export const tripModeEnum = pgEnum("trip_mode", ["pickup", "drop"]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const driverStatusEnum = pgEnum("driver_status", [
  "available",
  "busy",
  "offline",
]);

export const fulfillmentModeEnum = pgEnum("fulfillment_mode", [
  "driver_owned",
  "flexigo_fleet",
]);

export const fleetVehicleStatusEnum = pgEnum("fleet_vehicle_status", [
  "available",
  "assigned",
  "maintenance",
  "inactive",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vehicleConfig = pgTable("vehicle_config", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  baseFareCents: integer("base_fare_cents").notNull(),
  perMileCents: integer("per_mile_cents").notNull(),
  minimumFareCents: integer("minimum_fare_cents").notNull(),
  passengerCapacity: integer("passenger_capacity").notNull(),
  luggageCapacity: integer("luggage_capacity").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pricingPolicy = pgTable("pricing_policy", {
  id: text("id").primaryKey(),
  platformCommissionBps: integer("platform_commission_bps").notNull().default(2000),
  bookingFeeCents: integer("booking_fee_cents").notNull().default(250),
  airportAccessFeeCents: integer("airport_access_fee_cents").notNull().default(0),
  taxRateBps: integer("tax_rate_bps").notNull().default(0),
  fleetDriverTripPayCents: integer("fleet_driver_trip_pay_cents").notNull().default(0),
  fleetDriverPerMileCents: integer("fleet_driver_per_mile_cents").notNull().default(0),
  fleetFuelCostPerMileCents: integer("fleet_fuel_cost_per_mile_cents").notNull().default(0),
  fleetVehicleReservePerMileCents: integer("fleet_vehicle_reserve_per_mile_cents").notNull().default(0),
  paymentProcessingBps: integer("payment_processing_bps").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fleetVehicle = pgTable("fleet_vehicle", {
  id: text("id").primaryKey(),
  vehicleConfigId: text("vehicle_config_id")
    .notNull()
    .references(() => vehicleConfig.id),
  label: text("label").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  vin: text("vin").notNull().unique(),
  registrationNumber: text("registration_number").notNull().unique(),
  insurancePolicyNumber: text("insurance_policy_number").notNull(),
  insuranceExpiryDate: text("insurance_expiry_date").notNull(),
  status: fleetVehicleStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  confirmationId: text("confirmation_id").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  fulfillmentMode: fulfillmentModeEnum("fulfillment_mode").notNull().default("driver_owned"),

  tripMode: tripModeEnum("trip_mode").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropLocation: text("drop_location").notNull(),
  pickupAirport: text("pickup_airport"),
  dropAirport: text("drop_airport"),
  pickupAddress: text("pickup_address"),
  dropAddress: text("drop_address"),
  pickupAddressPlaceId: text("pickup_address_place_id"),
  dropAddressPlaceId: text("drop_address_place_id"),

  date: text("date").notNull(),
  time: text("time").notNull(),
  meridiem: text("meridiem").notNull(),

  passengerCount: integer("passenger_count").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleLabel: text("vehicle_label").notNull(),

  routeDistanceMeters: integer("route_distance_meters").notNull(),
  routeDistanceText: text("route_distance_text").notNull(),
  routeDurationText: text("route_duration_text").notNull(),

  // stored in cents to avoid floating-point rounding issues
  totalFareCents: integer("total_fare_cents").notNull(),
  tripFareCents: integer("trip_fare_cents").notNull().default(0),
  bookingFeeCents: integer("booking_fee_cents").notNull().default(0),
  airportAccessFeeCents: integer("airport_access_fee_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  platformCommissionCents: integer("platform_commission_cents").notNull().default(0),
  driverPayoutCents: integer("driver_payout_cents").notNull().default(0),
  fleetDriverCompensationCents: integer("fleet_driver_compensation_cents").notNull().default(0),
  fuelEstimateCents: integer("fuel_estimate_cents").notNull().default(0),
  vehicleReserveCents: integer("vehicle_reserve_cents").notNull().default(0),
  paymentProcessingCents: integer("payment_processing_cents").notNull().default(0),
  flexigoContributionCents: integer("flexigo_contribution_cents").notNull().default(0),

  driverName: text("driver_name"),
  assignedDriverId: text("assigned_driver_id"),
  assignedFleetVehicleId: text("assigned_fleet_vehicle_id").references(() => fleetVehicle.id),
  driverAssignedAt: timestamp("driver_assigned_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const driver = pgTable("driver", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  licenseNumber: text("license_number").notNull().unique(),
  registrationNumber: text("registration_number").unique(),
  vehicleType: text("vehicle_type"),
  vehicleLabel: text("vehicle_label"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceExpiryDate: text("insurance_expiry_date"),
  profileImage: text("profile_image"),
  status: driverStatusEnum("status").notNull().default("available"),
  homeCity: text("home_city").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
