import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { FleetPricingClient } from "./client";

export default async function FleetPricingPage() {
  await requireAdminOrRedirect();
  return <FleetPricingClient />;
}