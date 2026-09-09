import Link from "next/link";
import { Montserrat } from "next/font/google";
import { SiteFooter } from "../components/site-footer";
import { ParallaxLayer, Reveal } from "./_components/scroll-effects";
import {
  AirplaneIcon,
  BadgeCheckIcon,
  CalendarCheckIcon,
  MapPinIcon,
  PersonIcon,
  RouteDashLine,
  SedanIcon,
  ShieldCheckIcon,
  SuvIcon,
} from "./_components/icons";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export const metadata = {
  title: "About Us | FlexiGo",
  description:
    "FlexiGo is a licensed Transportation Network Company delivering safe, reliable, pre-scheduled private airport transfers across Connecticut.",
};

const differentiators = [
  {
    Icon: CalendarCheckIcon,
    title: "Always scheduled, never hailed",
    body: "Every FlexiGo ride is booked in advance. Our drivers are matched to a confirmed trip from the start \u2014 never idling or circling the streets waiting for the next fare.",
  },
  {
    Icon: MapPinIcon,
    title: "Tracked from door to door",
    body: "From the moment a driver sets out for a pickup to the moment a passenger arrives safely at their destination, every trip is actively tracked in real time.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "Vetted drivers, every time",
    body: "Every driver on our platform passes a comprehensive background and motor vehicle record screening before joining \u2014 and is held to that same standard for as long as they drive with us.",
  },
  {
    Icon: BadgeCheckIcon,
    title: "Fully licensed & insured",
    body: "FlexiGo operates as a compliant Transportation Network Company across Connecticut, with commercial auto coverage backing every trip we facilitate.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-800">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className={`${montserrat.className} text-2xl font-bold italic tracking-tight text-[#0B83E9]`}
          >
            FlexiGo
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Back to home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF6FF] to-white px-4 py-14 sm:px-6 sm:py-28">
        <ParallaxLayer
          speed={0.15}
          className="bg-[radial-gradient(circle_at_20%_20%,rgba(11,131,233,0.14),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(56,182,255,0.18),transparent_40%)]"
        />
        <ParallaxLayer
          speed={0.35}
          className="bg-[linear-gradient(to_bottom,rgba(11,131,233,0.06)_1px,transparent_1px),linear-gradient(to_right,rgba(11,131,233,0.06)_1px,transparent_1px)] bg-[size:56px_56px] opacity-60"
        />
        <ParallaxLayer speed={0.4} className="hidden sm:block">
          <AirplaneIcon className="absolute -right-4 top-6 h-24 w-24 rotate-[18deg] text-[#0B83E9]/15 sm:h-32 sm:w-32" />
          <SuvIcon className="absolute bottom-2 -left-2 h-16 w-32 text-[#0B83E9]/12 sm:h-20 sm:w-40" />
        </ParallaxLayer>
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0B83E9]">
            About FlexiGo
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl">
            Private travel, reimagined around certainty
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg">
            FlexiGo is a licensed Transportation Network Company (TNC)
            connecting travelers across Connecticut with a trusted network
            of independent, professional drivers &mdash;
            every ride scheduled ahead, every trip tracked door to door.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 text-[#0B83E9]">
            <AirplaneIcon className="h-6 w-6 shrink-0" />
            <RouteDashLine className="h-3 w-24 sm:w-32" />
            <MapPinIcon className="h-6 w-6 shrink-0" />
            <RouteDashLine className="h-3 w-24 sm:w-32" />
            <SedanIcon className="h-6 w-10 shrink-0" />
          </div>
        </Reveal>
      </section>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-14 sm:px-6 sm:py-16">
        {/* Story / mission */}
        <Reveal className="relative mx-auto max-w-2xl text-center">
          <PersonIcon className="pointer-events-none absolute -left-4 top-1 hidden h-14 w-14 -rotate-6 text-[#0B83E9]/10 sm:-left-16 sm:block sm:h-20 sm:w-20" />
          <SedanIcon className="pointer-events-none absolute -right-6 bottom-2 hidden h-12 w-20 text-[#0B83E9]/10 sm:-right-20 sm:block sm:h-16 sm:w-28" />
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Why we exist
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Getting to the airport shouldn&apos;t be a gamble. No circling
            for a ride, no surge pricing, no uncertainty about who&apos;s
            showing up. FlexiGo was built around a simple idea: book your
            transfer ahead of time, and let a vetted professional handle the
            rest &mdash; punctual, comfortable, and worry-free from pickup to
            drop-off.
          </p>
        </Reveal>

        {/* Differentiators */}
        <div className="mt-16">
          <Reveal className="text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              What makes FlexiGo different
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {differentiators.map((item, index) => (
              <Reveal key={item.title} delay={index * 90}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-[#D6ECFF] bg-[#F8FBFF] p-6 transition hover:shadow-lg hover:shadow-[#0B83E9]/10">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B83E9] to-[#38B6FF] text-white shadow-md shadow-[#0B83E9]/20">
                    <item.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Service area */}
        <Reveal
          delay={100}
          className="relative mt-16 overflow-hidden rounded-2xl border border-[#D6ECFF] bg-[#F8FBFF] p-8 text-center"
        >
          <AirplaneIcon className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rotate-[24deg] text-[#0B83E9]/8" />
          <h2 className="relative text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Where we operate
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            FlexiGo currently serves private airport transfers across
            Connecticut, connecting travelers to JFK, Boston Logan, Bradley
            International, and Newark Liberty airports.
          </p>
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
            {["JFK", "Boston Logan", "Bradley Intl", "Newark Liberty"].map(
              (airport) => (
                <span
                  key={airport}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D6ECFF] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B83E9]"
                >
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {airport}
                </span>
              )
            )}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal
          delay={150}
          className="mt-16 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-6"
        >
          <span className="relative inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-8 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Ride with FlexiGo
            <span className="absolute -top-3 right-2 rounded-full bg-[#0B83E9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Coming soon
            </span>
          </span>
          <span className="relative inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full border border-slate-200 px-8 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Drive with FlexiGo
            <span className="absolute -top-3 right-2 rounded-full bg-[#0B83E9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Coming soon
            </span>
          </span>
        </Reveal>

        {/* Contact */}
        <Reveal delay={200} className="mt-16 text-center">
          <h2 className="text-lg font-bold text-slate-900">Questions?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Reach our team anytime at{" "}
            <a
              href="mailto:support@flexigotravel.com"
              className="font-medium text-[#0B83E9] hover:underline"
            >
              support@flexigotravel.com
            </a>
            .
          </p>
        </Reveal>
      </div>

      <SiteFooter />
    </main>
  );
}
