import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user, vehicleConfig } from "@/lib/schema";

type VehiclePayload = {
  name?: unknown;
  baseFareCents?: unknown;
  perMileCents?: unknown;
  minimumFareCents?: unknown;
  passengerCapacity?: unknown;
  luggageCapacity?: unknown;
  sortOrder?: unknown;
};

function readInteger(value: unknown, field: string, minimum: number) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
    return `${field} must be a whole number of at least ${minimum}.`;
  }

  return null;
}

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return null;

  const db = getDb();
  const [caller] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return caller?.role === "admin" ? db : null;
}

export async function GET(request: NextRequest) {
  const db = await requireAdmin(request);
  if (!db) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const vehicles = await db
    .select()
    .from(vehicleConfig)
    .orderBy(asc(vehicleConfig.sortOrder), asc(vehicleConfig.name));

  return NextResponse.json(vehicles);
}

export async function POST(request: NextRequest) {
  const db = await requireAdmin(request);
  if (!db) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: VehiclePayload;
  try {
    body = (await request.json()) as VehiclePayload;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return NextResponse.json({ message: "Vehicle name must be between 1 and 60 characters." }, { status: 422 });
  }

  const errors = [
    readInteger(body.baseFareCents, "Base fare", 0),
    readInteger(body.perMileCents, "Per-mile rate", 0),
    readInteger(body.minimumFareCents, "Minimum fare", 0),
    readInteger(body.passengerCapacity, "Passenger capacity", 1),
    readInteger(body.luggageCapacity, "Luggage capacity", 0),
    readInteger(body.sortOrder ?? 0, "Sort order", 0),
  ].filter(Boolean);

  if (errors.length > 0) {
    return NextResponse.json({ message: errors[0] }, { status: 422 });
  }

  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!id) {
    return NextResponse.json({ message: "Vehicle name must include letters or numbers." }, { status: 422 });
  }

  const [existing] = await db.select({ id: vehicleConfig.id }).from(vehicleConfig).where(eq(vehicleConfig.id, id)).limit(1);
  if (existing) {
    return NextResponse.json({ message: "A vehicle with this name already exists." }, { status: 409 });
  }

  const [created] = await db
    .insert(vehicleConfig)
    .values({
      id,
      name,
      baseFareCents: body.baseFareCents as number,
      perMileCents: body.perMileCents as number,
      minimumFareCents: body.minimumFareCents as number,
      passengerCapacity: body.passengerCapacity as number,
      luggageCapacity: body.luggageCapacity as number,
      sortOrder: (body.sortOrder ?? 0) as number,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}