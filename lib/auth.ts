import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Role } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  return profile as Profile | null;
}

export async function requireRole(roles: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin" && !roles.includes(profile.role)) redirect("/login");
  return profile;
}

// Admin alone isn't enough for invoices/payments — finance_access must be
// explicitly granted, since not every admin should see financial records.
export async function requireFinanceAccess(): Promise<Profile> {
  const profile = await requireRole(["admin"]);
  if (!profile.finance_access) redirect("/admin");
  return profile;
}
