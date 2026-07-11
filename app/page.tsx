import { Montserrat } from "next/font/google";
import Link from "next/link";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#38B6FF] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:48px_48px] opacity-10" />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-24">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <div className="mb-8 flex items-center gap-3 rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm text-slate-900 shadow-lg shadow-white/15 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)] animate-pulse" />
            Premium private transfers, pre-scheduled
          </div>

          <h1
            className={`${montserrat.className} text-5xl font-bold italic tracking-tight text-balance text-white sm:text-6xl`}
          >
            FlexiGo
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
            A premium pre-scheduled private transfer service designed for calm,
            reliable airport and city travel.
          </p>

          <div className="mt-10 h-px w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          <Link
            href="/login"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#0f3b5a] shadow-md shadow-sky-500/25 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#38B6FF]"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
