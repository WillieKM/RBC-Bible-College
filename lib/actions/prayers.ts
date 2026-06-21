"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function postPrayerRequest(formData: FormData) {
  const profile = await requireRole(["student", "professor"]);
  const supabase = await createClient();

  const body = String(formData.get("body") || "").trim();
  const isAnonymous = formData.get("is_anonymous") === "on";
  if (!body) return;

  await supabase.from("prayer_requests").insert({
    author_id: profile.id,
    body,
    is_anonymous: isAnonymous,
  });

  revalidatePath("/student/prayers");
  revalidatePath("/professor/prayers");
}

export async function deletePrayerRequest(formData: FormData) {
  const profile = await requireRole(["student", "professor", "admin"]);
  const id = String(formData.get("id"));

  const admin = createAdminClient();
  // Admin can delete any; others only their own (enforced by RLS)
  if (profile.role === "admin") {
    await admin.from("prayer_requests").delete().eq("id", id);
  } else {
    const supabase = await createClient();
    await supabase.from("prayer_requests").delete().eq("id", id);
  }

  revalidatePath("/student/prayers");
  revalidatePath("/professor/prayers");
}

export async function togglePraying(formData: FormData) {
  const profile = await requireRole(["student", "professor"]);
  const supabase = await createClient();

  const requestId = String(formData.get("request_id"));
  const isPraying = formData.get("is_praying") === "true";

  if (isPraying) {
    // Remove the interaction
    await supabase.from("prayer_interactions").delete()
      .eq("request_id", requestId)
      .eq("user_id", profile.id);
  } else {
    // Add the interaction (ignore duplicate)
    await supabase.from("prayer_interactions").insert({
      request_id: requestId,
      user_id: profile.id,
    });
  }

  revalidatePath("/student/prayers");
  revalidatePath("/professor/prayers");
}
