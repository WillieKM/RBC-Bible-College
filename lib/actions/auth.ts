"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const redirectTo = String(formData.get("redirect") || "").trim();

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user!.id)
    .single();

  const ROLE_HOME: Record<string, string> = {
    admin: "/admin",
    professor: "/professor",
    student: "/student",
  };

  // Honour an explicit redirect (set by middleware or portal button) if the
  // user's role allows it, or if they are admin (who can access everything).
  if (redirectTo && (profile?.role === "admin" || redirectTo.startsWith(`/${profile?.role}`))) {
    redirect(redirectTo);
  }

  redirect(ROLE_HOME[profile?.role ?? ""] ?? "/login?error=No+role+assigned+to+this+account");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
