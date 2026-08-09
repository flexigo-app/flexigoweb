import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { ModulePlaceholder } from "../_components/module-placeholder";

export default async function AdminTransactionsPage() {
  await requireAdminOrRedirect();

  return (
    <ModulePlaceholder
      activeHref="/admin/transactions"
      title="Transactions"
      subtitle="Review payment flow, booking revenue, and payout health"
      comingSoonTitle="Finance operations module is next"
      comingSoonDescription="This page will show paid vs unpaid bookings, revenue trends, payout states, and drill-through transaction records."
    />
  );
}