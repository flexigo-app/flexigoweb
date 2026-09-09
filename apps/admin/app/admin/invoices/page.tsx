import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { AdminShell } from "../_components/admin-shell";

const invoiceRows = [
  { id: "INV-2104", customer: "Aster Capital", due: "Aug 17, 2026", status: "Due soon", amount: 1450 },
  { id: "INV-2103", customer: "Monarch Travel", due: "Aug 14, 2026", status: "Paid", amount: 3160 },
  { id: "INV-2102", customer: "Northside Events", due: "Aug 13, 2026", status: "Draft", amount: 880 },
  { id: "INV-2101", customer: "Urban Office", due: "Aug 11, 2026", status: "Outstanding", amount: 2750 },
];

const statusStyles: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Due soon": "bg-amber-50 text-amber-700 border-amber-200",
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Outstanding: "bg-rose-50 text-rose-700 border-rose-200",
};

export default async function AdminInvoicesPage() {
  await requireAdminOrRedirect();

  const openBalance = invoiceRows
    .filter((row) => row.status !== "Paid")
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <AdminShell
      activeHref="/admin/invoices"
      title="Invoicing"
      subtitle="Create billing records, invoice batches, and customer-ready statements"
      showBackButton
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Draft", value: "3", hint: "In progress" },
          { label: "Ready to send", value: "5", hint: "Queued" },
          { label: "Paid this week", value: "$8,420", hint: "Collections" },
          { label: "Open balance", value: `$${openBalance.toLocaleString()}`, hint: "Outstanding" },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Invoice Queue</h2>
          <button type="button" className="rounded-full border border-[#1A6FD4] bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1A6FD4]">
            Generate invoice batch
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Due</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 text-slate-700">
                  <td className="py-2 pr-4 font-semibold">{row.id}</td>
                  <td className="py-2 pr-4">{row.customer}</td>
                  <td className="py-2 pr-4">{row.due}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-semibold">${row.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
