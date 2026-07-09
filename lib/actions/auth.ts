"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  professor: "/professor",
  student: "/student",
};

const ALLOWED_RETURN = new Set(["/admin", "/professor", "/student"]);

const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_RATE_MAX = 10;                    // max failed attempts in that window
const RESET_RATE_MAX = 5;                     // stricter limit for password reset

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

async function isRateLimited(ip: string, max: number): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - LOGIN_RATE_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  return (count ?? 0) >= max;
}

async function recordFailedAttempt(ip: string, email: string) {
  const admin = createAdminClient();
  void admin.from("login_attempts").insert({ ip, email });
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "").trim();

  const ip = await getClientIp();
  if (await isRateLimited(ip, LOGIN_RATE_MAX)) {
    const params = new URLSearchParams({ error: "Too many failed attempts — please wait 15 minutes before trying again." });
    if (returnTo) params.set("returnTo", returnTo);
    redirect(`/login?${params.toString()}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    void recordFailedAttempt(ip, email);
    // Generic message so attackers can't enumerate valid emails
    const params = new URLSearchParams({ error: "Invalid email or password." });
    if (returnTo) params.set("returnTo", returnTo);
    redirect(`/login?${params.toString()}`);
  }

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user!.id)
    .single();

  // User authenticated but has no profile — should not happen in normal flow
  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login?error=Your+account+is+not+set+up.+Contact+an+administrator.");
  }

  const role = profile.role;

  // Admin can go anywhere; others can only go to their own portal
  if (returnTo && ALLOWED_RETURN.has(returnTo)) {
    if (role === "admin" || returnTo === ROLE_HOME[role]) {
      redirect(returnTo);
    }
  }

  redirect(ROLE_HOME[role] ?? "/login?error=No+portal+assigned.+Contact+an+administrator.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function sendPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  const ip = await getClientIp();
  if (await isRateLimited(ip, RESET_RATE_MAX)) {
    redirect("/login/reset?error=Too+many+requests+from+your+network.+Please+wait+15+minutes.");
  }

  const admin = createAdminClient();

  // Only allow resets for emails that exist in our profiles table
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    // Don't reveal whether the email is registered
    void recordFailedAttempt(ip, email);
    redirect("/login/reset?sent=1");
  }

  // Use generateLink so we send via our own Gmail (not Supabase's email service).
  // Falls back through multiple env var names in case Vercel uses BASE_URL instead of NEXT_PUBLIC_BASE_URL.
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { data: link } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${baseUrl}/settings/new-password` },
  });

  if (link?.properties?.action_link) {
    await sendPasswordResetEmail({
      to: email,
      fullName: profile.full_name,
      resetUrl: link.properties.action_link,
    });
  }

  redirect("/login/reset?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  redirect("/settings?pw_saved=1");
}

export async function updateProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};

  const fullName = String(formData.get("full_name") || "").trim();
  if (fullName && fullName !== profile.full_name) updates.full_name = fullName;

  const phone = String(formData.get("phone") || "").trim() || null;
  if (phone !== profile.phone) updates.phone = phone;

  const address = String(formData.get("address") || "").trim() || null;
  if (address !== profile.address) updates.address = address;

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
