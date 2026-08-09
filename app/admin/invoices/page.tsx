import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { ModulePlaceholder } from "../_components/module-placeholder";

export default async function AdminInvoicesPage() {
  await requireAdminOrRedirect();

  return (
    <ModulePlaceholder
      activeHref="/admin/invoices"
      title="Invoicing"
      subtitle="Create billing records, invoice batches, and customer-ready statements"
      comingSoonTitle="Invoice management will be layered on finance data"
      comingSoonDescription="This page will host invoice generation, invoice history, and booking-to-invoice relationships once transaction workflows are complete."
    />
  );
}