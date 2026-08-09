import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { AdminRidesClient } from "./client";

export default async function AdminRidesPage() {
  // Server-side auth check — redirects non-admins before any HTML is sent to client
  await requireAdminOrRedirect();

  // Only admins reach here
  return <AdminRidesClient />;
}
