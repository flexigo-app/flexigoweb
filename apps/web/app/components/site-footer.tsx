import Link from "next/link";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

// Driver app runs on its own deployment; falls back to the local dev port.
const driverAppUrl = process.env.NEXT_PUBLIC_DRIVER_URL || "http://localhost:3002";
const supportEmail = "support@flexigotravel.com";

type FooterLinkGroup = {
  heading: string;
  links: { label: string; href: string; external?: boolean; disabled?: boolean }[];
};

const linkGroups: FooterLinkGroup[] = [
  {
    heading: "Company",
    links: [{ label: "About Us", href: "/about" }],
  },
  {
    heading: "Riders",
    links: [
      { label: "Book a ride", href: "/", disabled: true },
      { label: "Login", href: "/login", disabled: true },
      { label: "My rides", href: "/my-rides", disabled: true },
    ],
  },
  {
    heading: "Drivers",
    links: [
      { label: "Join us as a driver", href: driverAppUrl, external: true, disabled: true },
      { label: "Login as a driver", href: driverAppUrl, external: true, disabled: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative bg-[#0B2540] text-slate-300">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <span
              className={`${montserrat.className} text-2xl font-bold italic tracking-tight text-white`}
            >
              FlexiGo
            </span>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Reliable, pre-scheduled private airport transfers for
              Connecticut.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-4 inline-block text-sm font-medium text-[#7CC4FF] hover:text-white"
            >
              {supportEmail}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-10">
            {linkGroups.map((group) => (
              <div key={group.heading}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.heading}
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.disabled ? (
                        <span className="inline-flex cursor-not-allowed items-center gap-2 text-sm text-slate-500">
                          {link.label}
                          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            Soon
                          </span>
                        </span>
                      ) : link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-300 transition hover:text-white"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-slate-300 transition hover:text-white"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} FlexiGo LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-slate-500 hover:text-slate-300">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-300">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
