"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

export async function sendPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/settings/new-password`,
  });
  redirect("/login/reset?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/settings/new-password?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Password+updated.+Sign+in+with+your+new+password.");
}

export async function updateProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};

  const fullName = String(formData.get("full_name") || "").trim();
  if (fullName && fullName !== profile.full_name) updates.full_name = fullName;

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const admin = createAdminClient();
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `profiles/${profile.id}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("application-photos")
      .upload(path, photo, { contentType: photo.type, upsert: true });
    if (!uploadError) {
      const { data: urlData } = admin.storage.from("application-photos").getPublicUrl(path);
      updates.avatar_url = urlData.publicUrl;
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("profiles").update(updates).eq("id", profile.id);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
