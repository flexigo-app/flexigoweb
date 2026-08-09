import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { AdminDashboardClient } from "./client";

export default async function AdminPage() {
  await requireAdminOrRedirect();
  return <AdminDashboardClient />;
}
