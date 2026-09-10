import { Montserrat } from "next/font/google";
import { SiteFooter } from "../components/site-footer";
import { HomeLink } from "../components/home-link";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export const metadata = {
  title: "Terms of Service | FlexiGo",
};

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-800">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <HomeLink
            className={`${montserrat.className} text-2xl font-bold italic tracking-tight text-[#0B83E9]`}
          >
            FlexiGo
          </HomeLink>
          <HomeLink
            className="text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Back to home
          </HomeLink>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B83E9]">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of terms</h2>
            <p className="mt-2">
              By accessing or using the FlexiGo platform, including our website
              and mobile experiences (the &quot;Service&quot;), you agree to be
              bound by these Terms of Service. If you do not agree, please do
              not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2. Booking &amp; rides</h2>
            <p className="mt-2">
              FlexiGo connects riders with independent, licensed drivers for
              pre-scheduled private transfers. All bookings are subject to
              availability, and fares are calculated based on distance, vehicle
              type, and applicable fees at the time of booking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Cancellations &amp; refunds</h2>
            <p className="mt-2">
              Cancellation windows and refund eligibility vary by booking type
              and are shown at checkout. Repeated late cancellations or no-shows
              may result in additional fees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Driver conduct</h2>
            <p className="mt-2">
              Drivers on the FlexiGo network agree to maintain valid licensing,
              insurance, and vehicle safety standards. Riders may report
              conduct or safety concerns to our support team at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Account responsibility</h2>
            <p className="mt-2">
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activity that occurs under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">6. Limitation of liability</h2>
            <p className="mt-2">
              FlexiGo is not liable for indirect, incidental, or consequential
              damages arising from use of the Service, to the maximum extent
              permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">7. Changes to these terms</h2>
            <p className="mt-2">
              We may update these Terms of Service from time to time. Continued
              use of the Service after changes take effect constitutes
              acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">8. Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent to{" "}
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
