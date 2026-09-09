import { AdminShell } from "./admin-shell";

type ModulePlaceholderProps = {
  activeHref: string;
  title: string;
  subtitle: string;
  comingSoonTitle: string;
  comingSoonDescription: string;
};

export function ModulePlaceholder({
  activeHref,
  title,
  subtitle,
  comingSoonTitle,
  comingSoonDescription,
}: ModulePlaceholderProps) {
  return (
    <AdminShell activeHref={activeHref} title={title} subtitle={subtitle} showBackButton>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4B88C5]">Planned Module</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">{comingSoonTitle}</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">{comingSoonDescription}</p>
        </div>
      </section>
    </AdminShell>
  );
}