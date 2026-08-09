import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { AdminDriversClient } from "./client";

export default async function AdminDriversPage() {
  await requireAdminOrRedirect();
  return <AdminDriversClient />;
}