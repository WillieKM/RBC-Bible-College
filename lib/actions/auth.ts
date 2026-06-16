"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  professor: "/professor",
  student: "/student",
};

const ALLOWED_RETURN = new Set(["/admin", "/professor", "/student"]);

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({ error: error.message });
    if (returnTo) params.set("returnTo", returnTo);
    redirect(`/login?${params.toString()}`);
  }

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user!.id)
    .single();

  const role = profile?.role ?? "";

  // Admin can go anywhere; others can only go to their own portal
  if (returnTo && ALLOWED_RETURN.has(returnTo)) {
    if (role === "admin" || returnTo === ROLE_HOME[role]) {
      redirect(returnTo);
    }
  }

  redirect(ROLE_HOME[role] ?? "/login?error=No+role+assigned");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
