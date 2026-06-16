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

  const portal = String(formData.get("portal") || "").trim();

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user!.id)
    .single();

  // Admins can be directed to any portal via the login page choice
  if (profile?.role === "admin" && (portal === "student" || portal === "professor")) {
    redirect(`/${portal}`);
  }

  switch (profile?.role) {
    case "admin":
      redirect("/admin");
    case "professor":
      redirect("/professor");
    case "student":
      redirect("/student");
    default:
      redirect("/login?error=No+role+assigned+to+this+account");
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
