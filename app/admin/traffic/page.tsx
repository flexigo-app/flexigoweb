import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { ModulePlaceholder } from "../_components/module-placeholder";

export default async function AdminTrafficPage() {
  await requireAdminOrRedirect();

  return (
    <ModulePlaceholder
      activeHref="/admin/traffic"
      title="Traffic & Sessions"
      subtitle="Understand visit quality, session behavior, and where booking demand originates"
      comingSoonTitle="Analytics instrumentation is required first"
      comingSoonDescription="This page will show sessions, device mix, geo distribution, and conversion from visit to booking once tracking events are captured."
    />
  );
}