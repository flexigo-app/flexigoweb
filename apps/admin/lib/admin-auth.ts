import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Returns the session user with role, or null if unauthenticated.
export const getAdminSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const db = getDb();
  const [dbUser] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser || dbUser.role !== "admin") return null;
  return dbUser;
};

// Use in Server Components — redirects non-admins immediately.
export const requireAdminOrRedirect = async () => {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect("/login");
  return adminUser;
};
