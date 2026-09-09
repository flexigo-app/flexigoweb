import Link from "next/link";
import { Montserrat } from "next/font/google";
import { SiteFooter } from "../components/site-footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export const metadata = {
  title: "Privacy Policy | FlexiGo",
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-800">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
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

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B83E9]">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Information we collect</h2>
            <p className="mt-2">
              We collect information you provide directly, such as your name,
              email, profile photo (via Google sign-in), pickup/drop
              addresses, and booking details. We also collect limited usage
              data to keep the Service reliable and secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2. How we use your information</h2>
            <p className="mt-2">
              We use your information to process bookings, match you with
              drivers, calculate fares, provide customer support, and improve
              the Service. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Sharing with drivers &amp; partners</h2>
            <p className="mt-2">
              Booking details necessary to complete a ride (such as pickup and
              drop locations and rider name) are shared with the assigned
              driver. We may share limited data with payment processors and
              service providers who help us operate the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Data retention</h2>
            <p className="mt-2">
              We retain booking and account information for as long as
              necessary to provide the Service, comply with legal obligations,
              and resolve disputes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Your choices</h2>
            <p className="mt-2">
              You may request access to, correction of, or deletion of your
              personal information by contacting our support team. You can
              also sign out or revoke Google account access at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">6. Security</h2>
            <p className="mt-2">
              We use industry-standard safeguards to protect your information,
              including encrypted connections and access controls. No method
              of transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">7. Changes to this policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy periodically. Material changes
              will be reflected by updating the &quot;Last updated&quot; date
              above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">8. Contact</h2>
            <p className="mt-2">
              For privacy questions or requests, email{" "}
              <a
                href="mailto:support@flexigotravel.com"
                className="font-medium text-[#0B83E9] hover:underline"
              >
                support@flexigotravel.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
