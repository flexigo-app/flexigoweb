import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { AdminShell } from "../_components/admin-shell";

const txRows = [
  { id: "BK-1048", customer: "amira@flexigo.com", method: "Card", date: "Aug 10, 2026", status: "Paid", amount: 284.0 },
  { id: "BK-1047", customer: "nolan@austinrides.com", method: "Wallet", date: "Aug 09, 2026", status: "Pending", amount: 196.5 },
  { id: "BK-1046", customer: "samira@travel.com", method: "Bank Transfer", date: "Aug 09, 2026", status: "Paid", amount: 432.0 },
  { id: "BK-1045", customer: "jordan.lee@outlook.com", method: "Card", date: "Aug 08, 2026", status: "Review", amount: 128.0 },
  { id: "BK-1044", customer: "david.m@meridian.io", method: "Card", date: "Aug 08, 2026", status: "Paid", amount: 310.0 },
];

const statusStyles: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Review: "bg-sky-50 text-sky-700 border-sky-200",
};

export default async function AdminTransactionsPage() {
  await requireAdminOrRedirect();

  const totalVolume = txRows.reduce((sum, item) => sum + item.amount, 0);
  const paidCount = txRows.filter((item) => item.status === "Paid").length;
  const pendingCount = txRows.filter((item) => item.status === "Pending").length;
  const payoutReady = 1540.0;

  return (
    <AdminShell
      activeHref="/admin/transactions"
      title="Transactions"
      subtitle="Review payment flow, booking revenue, and payout health"
      showBackButton
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Gross Volume", value: `$${totalVolume.toFixed(2)}`, hint: "Last 7 days" },
          { label: "Paid", value: `${paidCount}`, hint: "Confirmed settlements" },
          { label: "Pending", value: `${pendingCount}`, hint: "Awaiting capture" },
          { label: "Payout Ready", value: `$${payoutReady.toFixed(2)}`, hint: "Driver settlement" },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Payment Ledger</h2>
            <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Export CSV
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Booking</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {txRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-4 font-semibold">{row.id}</td>
                    <td className="py-2 pr-4">{row.customer}</td>
                    <td className="py-2 pr-4">{row.method}</td>
                    <td className="py-2 pr-4">{row.date}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-semibold">${row.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Settlement Health</h2>
          <div className="mt-4 space-y-4">
            {[
              { label: "Card success", value: "98.4%", bar: 98, color: "bg-emerald-500" },
              { label: "Wallet pending", value: "11.2%", bar: 42, color: "bg-amber-500" },
              { label: "Chargebacks", value: "0.6%", bar: 16, color: "bg-sky-500" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{metric.label}</span>
                  <span className="font-bold text-slate-900">{metric.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${metric.color}`} style={{ width: `${metric.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
