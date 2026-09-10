"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { authClient } from "@/lib/auth-client";

type HomeLinkProps = Omit<ComponentProps<typeof Link>, "href">;

// Routes logged-in users to their dashboard instead of the public landing page.
export function HomeLink(props: HomeLinkProps) {
  const { data: sessionData } = authClient.useSession();
  const href = sessionData?.session ? "/user" : "/";
  return <Link href={href} {...props} />;
}
