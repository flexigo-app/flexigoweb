import { desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { booking, driver, user } from "@/lib/schema";

type DriverInsert = typeof driver.$inferInsert;

const demoDrivers: DriverInsert[] = [
  {
    id: "drv-demo-1",
    name: "Marcus Rivera",
    email: "marcus.rivera.demo@flexigo.test",
    phoneNumber: "(860) 555-0181",
    licenseNumber: "CT-DL-482190",
    registrationNumber: "CT-SUV-2048",
    vehicleType: "suv",
    vehicleLabel: "2023 Chevrolet Suburban",
    insurancePolicyNumber: "POL-CT-20481",
    insuranceExpiryDate: "11/30/2026",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    status: "available",
    homeCity: "Hartford, CT",
    notes: "Prefers airport pickups and premium SUV transfers.",
  },
  {
    id: "drv-demo-2",
    name: "Tanya Brooks",
    email: "tanya.brooks.demo@flexigo.test",
    phoneNumber: "(413) 555-0117",
    licenseNumber: "MA-DL-572201",
    registrationNumber: "MA-SDN-1187",
    vehicleType: "sedan",
    vehicleLabel: "2024 Toyota Camry Hybrid",
    insurancePolicyNumber: "POL-MA-11871",
    insuranceExpiryDate: "02/14/2027",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
    status: "busy",
    homeCity: "Springfield, MA",
    notes: "Strong completion history on early morning rides.",
  },
  {
    id: "drv-demo-3",
    name: "David Chen",
    email: "david.chen.demo@flexigo.test",
    phoneNumber: "(203) 555-0162",
    licenseNumber: "CT-DL-661903",
    registrationNumber: "CT-SUV-3391",
    vehicleType: "suv",
    vehicleLabel: "2022 Ford Expedition",
    insurancePolicyNumber: "POL-CT-33911",
    insuranceExpiryDate: "08/09/2027",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
    status: "available",
    homeCity: "New Haven, CT",
    notes: "Handles long-haul transfers to JFK and EWR.",
  },
  {
    id: "drv-demo-4",
    name: "Olivia Grant",
    email: "olivia.grant.demo@flexigo.test",
    phoneNumber: "(857) 555-0106",
    licenseNumber: "MA-DL-420115",
    registrationNumber: "MA-SDN-5510",
    vehicleType: "sedan",
    vehicleLabel: "2023 Honda Accord",
    insurancePolicyNumber: "POL-MA-55100",
    insuranceExpiryDate: "05/24/2027",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    status: "offline",
    homeCity: "Boston, MA",
    notes: "Off today for vehicle detailing and inspection.",
  },
  {
    id: "drv-demo-5",
    name: "Andre Patel",
    email: "andre.patel.demo@flexigo.test",
    phoneNumber: "(860) 555-0194",
    licenseNumber: "CT-DL-882511",
    registrationNumber: "CT-SUV-6720",
    vehicleType: "suv",
    vehicleLabel: "2024 GMC Yukon XL",
    insurancePolicyNumber: "POL-CT-67200",
    insuranceExpiryDate: "01/18/2027",
    profileImage: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&q=80",
    status: "busy",
    homeCity: "Bridgeport, CT",
    notes: "Currently dedicated to high-capacity family airport trips.",
  },
];

const ensureAdmin = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return { error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }) };

  const db = getDb();
  const [caller] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!caller || caller.role !== "admin") {
    return { error: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }

  return { db };
};

const ensureDemoDrivers = async (db: ReturnType<typeof getDb>) => {
  if (process.env.NODE_ENV === "production") return;

  const existing = await db.select({ id: driver.id }).from(driver).limit(1);
  if (existing.length > 0) return;

  await db.insert(driver).values(demoDrivers);
};

export async function GET(request: NextRequest) {
  const admin = await ensureAdmin(request);
  if ("error" in admin) return admin.error;

  await ensureDemoDrivers(admin.db);

  const rows = await admin.db
    .select({
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      licenseNumber: driver.licenseNumber,
      registrationNumber: driver.registrationNumber,
      vehicleType: driver.vehicleType,
      vehicleLabel: driver.vehicleLabel,
      insurancePolicyNumber: driver.insurancePolicyNumber,
      insuranceExpiryDate: driver.insuranceExpiryDate,
      profileImage: driver.profileImage,
      status: driver.status,
      homeCity: driver.homeCity,
      notes: driver.notes,
      assignedRideCount: sql<number>`count(${booking.id})`,
    })
    .from(driver)
    .leftJoin(booking, eq(booking.driverName, driver.name))
    .groupBy(
      driver.id,
      driver.name,
      driver.email,
      driver.phoneNumber,
      driver.licenseNumber,
      driver.registrationNumber,
      driver.vehicleType,
      driver.vehicleLabel,
      driver.insurancePolicyNumber,
      driver.insuranceExpiryDate,
      driver.profileImage,
      driver.status,
      driver.homeCity,
      driver.notes
    )
    .orderBy(desc(driver.createdAt));

  return NextResponse.json(rows);
}