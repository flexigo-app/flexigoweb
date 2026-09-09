"use client";

import Link from "next/link";
import { Montserrat } from "next/font/google";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SiteFooter } from "../components/site-footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export default function LoginPage() {
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionData?.session) {
      router.replace("/user");
    }
  }, [router, sessionData]);

  const handleGoogleSignIn = async (selectAccount: boolean = false) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (selectAccount) {
        // Sign out first to clear better-auth session
        await authClient.signOut();

        // Ask Better Auth for the provider URL and force account chooser.
        const result = await authClient.signIn.social({
          provider: "google",
          callbackURL: "/user",
          disableRedirect: true,
        });

        const providerUrl = result?.data?.url;
        if (providerUrl) {
          const url = new URL(providerUrl);
          url.searchParams.set("prompt", "select_account");
          window.location.href = url.toString();
          return;
        }

        // Fallback to standard flow if URL extraction fails.
        await authClient.signIn.social({
          provider: "google",
          callbackURL: "/user",
        });
        return;
      }

      // Standard seamless login with better-auth
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/user",
      });
    } catch {
      setErrorMessage(
        "Google sign-in is not available yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file."
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#38B6FF] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:48px_48px] opacity-10" />

      <section className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-sm rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-xl shadow-sky-700/20 backdrop-blur-md sm:max-w-md sm:p-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-900/75">
            FlexiGo Access
          </p>

          <h1
            className={`${montserrat.className} text-4xl font-bold italic leading-tight tracking-tight text-white sm:text-5xl`}
          >
            Login
          </h1>

          <p className="mt-4 text-base leading-7 text-white/95 sm:text-lg">
            Continue with your Google account to access the FlexiGo dashboard.
          </p>

          <button
            type="button"
            onClick={() => handleGoogleSignIn(false)}
            disabled={isLoading || isPending}
            className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-white px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#0f3b5a] shadow-lg shadow-sky-600/25 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            {isLoading || isPending ? "Redirecting..." : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => handleGoogleSignIn(true)}
            disabled={isLoading || isPending}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-white/60 bg-transparent px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white/85 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Use a different account
          </button>

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-slate-900/15 bg-white/35 px-4 py-3 text-sm text-slate-900/85">
              {errorMessage}
            </p>
          ) : null}

          <Link
            href="/"
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full border border-white/60 bg-transparent px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/15"
          >
            Back to home
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
