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

export const vehicleTypeEnum = pgEnum("vehicle_type", ["sedan", "suv"]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const driverStatusEnum = pgEnum("driver_status", [
  "available",
  "busy",
  "offline",
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

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  confirmationId: text("confirmation_id").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: bookingStatusEnum("status").notNull().default("pending"),

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
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  vehicleLabel: text("vehicle_label").notNull(),

  routeDistanceMeters: integer("route_distance_meters").notNull(),
  routeDistanceText: text("route_distance_text").notNull(),
  routeDurationText: text("route_duration_text").notNull(),

  // stored in cents to avoid floating-point rounding issues
  totalFareCents: integer("total_fare_cents").notNull(),

  driverName: text("driver_name"),
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
  registrationNumber: text("registration_number").notNull().unique(),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  vehicleLabel: text("vehicle_label").notNull(),
  insurancePolicyNumber: text("insurance_policy_number").notNull(),
  insuranceExpiryDate: text("insurance_expiry_date").notNull(),
  profileImage: text("profile_image"),
  status: driverStatusEnum("status").notNull().default("available"),
  homeCity: text("home_city").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
