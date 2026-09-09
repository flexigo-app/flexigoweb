import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { AdminShell } from "../_components/admin-shell";

const reportRows = [
  { label: "Ride volume", value: "1,248", delta: "+12.4%", tone: "up" },
  { label: "Avg. trip value", value: "$94.80", delta: "+4.8%", tone: "up" },
  { label: "Cancellation rate", value: "4.3%", delta: "-1.2%", tone: "down" },
  { label: "Driver utilization", value: "76%", delta: "+3.1%", tone: "up" },
];

export default async function AdminReportsPage() {
  await requireAdminOrRedirect();

  return (
    <AdminShell
      activeHref="/admin/reports"
      title="Reports & CSV"
      subtitle="Generate operational and finance exports with reusable filters"
      showBackButton
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {reportRows.map((row) => (
          <article key={row.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{row.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-extrabold text-slate-900">{row.value}</p>
              <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${row.tone === "up" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {row.delta}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Report Library</h2>
            <div className="flex gap-2">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                Last 7 days
              </button>
              <button type="button" className="rounded-full border border-[#1A6FD4] bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1A6FD4]">
                Export current view
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { name: "Bookings summary", type: "Operations", updated: "2 hours ago" },
              { name: "Revenue by region", type: "Finance", updated: "4 hours ago" },
              { name: "Cancellation audit", type: "Quality", updated: "Today" },
              { name: "Driver productivity", type: "Operations", updated: "Today" },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.type} · Updated {item.updated}</p>
                </div>
                <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Download CSV
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Quick Filters</h2>
          <div className="mt-4 grid gap-2">
            {[
              "All bookings",
              "Paid rides",
              "Cancelled rides",
              "New drivers",
              "Weekend demand",
            ].map((filter) => (
              <button
                key={filter}
                type="button"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-[#9EC8F4] hover:bg-[#F4FAFF]"
              >
                {filter}
              </button>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
