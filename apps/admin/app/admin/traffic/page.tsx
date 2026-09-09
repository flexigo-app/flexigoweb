import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { AdminShell } from "../_components/admin-shell";

const channels = [
  { label: "Organic Search", value: 42, amount: 18400 },
  { label: "Direct", value: 21, amount: 9600 },
  { label: "Paid Social", value: 18, amount: 8200 },
  { label: "Referral", value: 12, amount: 5100 },
  { label: "Email", value: 7, amount: 3000 },
];

export default async function AdminTrafficPage() {
  await requireAdminOrRedirect();

  return (
    <AdminShell
      activeHref="/admin/traffic"
      title="Traffic & Sessions"
      subtitle="Understand visit quality, session behavior, and where booking demand originates"
      showBackButton
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Sessions", value: "24,780", hint: "Last 7 days" },
          { label: "Booked sessions", value: "2,140", hint: "8.6% conversion" },
          { label: "Avg. time on site", value: "4m 12s", hint: "Engaged visits" },
          { label: "Bounce rate", value: "32%", hint: "Healthy flow" },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Channel Mix</h2>
          <div className="mt-4 space-y-4">
            {channels.map((channel) => (
              <div key={channel.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{channel.label}</span>
                  <span className="font-bold text-slate-900">{channel.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#1A6FD4] to-[#5CB2FF]" style={{ width: `${channel.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Top Regions</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Austin, TX", value: "34%" },
              { label: "Dallas, TX", value: "24%" },
              { label: "Houston, TX", value: "18%" },
              { label: "San Antonio, TX", value: "14%" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
