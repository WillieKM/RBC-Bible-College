// Server-only: uses the service-role client. Never import from client components.
import type { User } from "@supabase/supabase-js";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

// Supabase has no admin "get user by email", and listUsers() is paginated
// (default 50 per page), so a single-page lookup misses users on later pages.
// Walk every page; if the user is still not found but is known to exist (e.g.
// createUser said "already registered"), fall back to generateLink, which
// returns the existing user's record without sending anything.
export async function findAuthUserByEmail(
  admin: AdminClient,
  email: string,
  { knownToExist = false }: { knownToExist?: boolean } = {}
): Promise<User | null> {
  const target = email.trim().toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[findAuthUserByEmail] listUsers failed:", error);
      break;
    }
    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.trim().toLowerCase() === target);
    if (match) return match;
    // Use the API's own pagination marker: the server may cap perPage below
    // what we asked for, so "fewer than perPage" doesn't mean "last page".
    if (users.length === 0 || !data.nextPage) break;
  }

  // Only safe when the user already exists: for an unknown email, generating
  // a magic link could create a new account as a side effect.
  if (knownToExist) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: target });
    if (!error && data?.user) return data.user;
    if (error) console.error("[findAuthUserByEmail] generateLink fallback failed:", error);
  }

  return null;
}
