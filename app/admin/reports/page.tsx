import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { ModulePlaceholder } from "../_components/module-placeholder";

export default async function AdminReportsPage() {
  await requireAdminOrRedirect();

  return (
    <ModulePlaceholder
      activeHref="/admin/reports"
      title="Reports & CSV"
      subtitle="Generate operational and finance exports with reusable filters"
      comingSoonTitle="Export center will be built next"
      comingSoonDescription="This page will provide booking, cancellation, and revenue exports with date filters and reusable report presets."
    />
  );
}