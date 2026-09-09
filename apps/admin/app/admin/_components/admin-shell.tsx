"use client";

import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700"], style: ["italic"] });

type NavItem = {
  href: string;
  label: string;
};

type AdminShellProps = {
  activeHref: string;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  children: ReactNode;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/rides", label: "Rides" },
  { href: "/admin/fleet-pricing", label: "Fleet & Pricing" },
  { href: "/admin/drivers", label: "Drivers" },
];

const customerAppUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

export function AdminShell({
  activeHref,
  title,
  subtitle,
  showBackButton = false,
  children,
}: AdminShellProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/admin");
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className={`${montserrat.className} text-2xl font-bold italic text-[#1A6FD4]`}>
              FlexiGo
            </Link>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-700">
              Admin
            </span>
          </div>

          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  activeHref === item.href
                    ? "text-sm font-semibold text-[#1A6FD4]"
                    : "text-sm font-medium text-slate-600 hover:text-slate-900"
                }
              >
                {item.label}
              </Link>
            ))}
            <Link href={customerAppUrl} className="text-sm font-medium text-slate-500 hover:text-slate-800">
              Customer site
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
            aria-label="Toggle admin menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="text-xl leading-none">☰</span>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={
                    activeHref === item.href
                      ? "rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-[#1A6FD4]"
                      : "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  }
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={customerAppUrl}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Customer site
              </Link>
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {(showBackButton || title || subtitle) && (
          <div className="mb-6">
            {showBackButton && (
              <button
                type="button"
                onClick={handleBack}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              >
                <span aria-hidden="true">←</span>
                Back
              </button>
            )}

            {title && <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}

        {children}
        <div className="h-20 md:hidden" />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-2">
          <Link href="/admin" className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${activeHref === "/admin" ? "bg-blue-50 text-[#1A6FD4]" : "text-slate-600"}`}>
            Overview
          </Link>
          <Link href="/admin/rides" className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${activeHref === "/admin/rides" ? "bg-blue-50 text-[#1A6FD4]" : "text-slate-600"}`}>
            Rides
          </Link>
          <Link href="/admin/fleet-pricing" className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${activeHref === "/admin/fleet-pricing" ? "bg-blue-50 text-[#1A6FD4]" : "text-slate-600"}`}>
            Fleet
          </Link>
          <Link href="/admin/drivers" className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${activeHref === "/admin/drivers" ? "bg-blue-50 text-[#1A6FD4]" : "text-slate-600"}`}>
            Drivers
          </Link>
          <Link href={customerAppUrl} className="rounded-lg px-2 py-2 text-center text-xs font-semibold text-slate-600">
            Site
          </Link>
        </div>
      </nav>
    </main>
  );
}