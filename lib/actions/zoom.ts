"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createZoomSession(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const zoomUrl = String(formData.get("zoom_url") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const programId = String(formData.get("program_id") || "") || null;
  const recurrence = String(formData.get("recurrence") || "none") as "none" | "weekly" | "biweekly" | "monthly";
  const sendAtRaw = String(formData.get("send_at") || "").trim();
  const dayOfWeekRaw = String(formData.get("day_of_week") || "").trim();

  if (!title || !zoomUrl) return;

  const sendAt = sendAtRaw ? new Date(sendAtRaw).toISOString() : null;
  const dayOfWeek = dayOfWeekRaw !== "" ? parseInt(dayOfWeekRaw, 10) : null;

  await supabase.from("zoom_sessions").insert({
    title,
    zoom_url: zoomUrl,
    description,
    program_id: programId,
    recurrence,
    send_at: sendAt,
    day_of_week: recurrence !== "none" ? dayOfWeek : null,
    created_by: profile.id,
  });

  revalidatePath("/admin/zoom");
}

export async function updateZoomSession(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const zoomUrl = String(formData.get("zoom_url") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const programId = String(formData.get("program_id") || "") || null;
  const recurrence = String(formData.get("recurrence") || "none") as "none" | "weekly" | "biweekly" | "monthly";
  const sendAtRaw = String(formData.get("send_at") || "").trim();
  const dayOfWeekRaw = String(formData.get("day_of_week") || "").trim();

  if (!id || !title || !zoomUrl) return;

  const sendAt = sendAtRaw ? new Date(sendAtRaw).toISOString() : null;
  const dayOfWeek = dayOfWeekRaw !== "" ? parseInt(dayOfWeekRaw, 10) : null;

  await supabase.from("zoom_sessions").update({
    title,
    zoom_url: zoomUrl,
    description,
    program_id: programId,
    recurrence,
    send_at: sendAt,
    day_of_week: recurrence !== "none" ? dayOfWeek : null,
    // Reset last_sent_at so cron picks it up again after a URL or schedule change
    last_sent_at: null,
  }).eq("id", id);

  revalidatePath("/admin/zoom");
  redirect("/admin/zoom");
}

export async function toggleZoomSession(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  await admin.from("zoom_sessions").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/zoom");
}

export async function deleteZoomSession(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id") || "");
  await admin.from("zoom_sessions").delete().eq("id", id);
  revalidatePath("/admin/zoom");
}
