"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendZoomLinkEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All Students", doctorate: "Doctorate", bachelors: "Bachelor's",
  masters: "Master's", diploma: "Diploma", certificate: "Certificate",
};

export async function createZoomSession(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const zoomUrl = String(formData.get("zoom_url") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const recordingUrl = String(formData.get("recording_url") || "").trim() || null;
  const targetAudience = String(formData.get("target_audience") || "all");
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
    recording_url: recordingUrl,
    target_audience: targetAudience,
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
  const recordingUrl = String(formData.get("recording_url") || "").trim() || null;
  const targetAudience = String(formData.get("target_audience") || "all");
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
    recording_url: recordingUrl,
    target_audience: targetAudience,
    recurrence,
    send_at: sendAt,
    day_of_week: recurrence !== "none" ? dayOfWeek : null,
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

export async function sendZoomNow(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data: session } = await admin.from("zoom_sessions").select("*").eq("id", id).single();
  if (!session) { revalidatePath("/admin/zoom"); return; }

  let studentsQuery = admin
    .from("profiles")
    .select("full_name, email")
    .eq("role", "student");

  if (session.target_audience !== "all") {
    const { data: programs } = await admin
      .from("programs")
      .select("id")
      .eq("program_level", session.target_audience);
    const ids = (programs ?? []).map((p: { id: string }) => p.id);
    if (ids.length > 0) studentsQuery = studentsQuery.in("program_id", ids);
    else { revalidatePath("/admin/zoom"); return; }
  }

  const { data: students } = await studentsQuery;
  const programName = AUDIENCE_LABELS[session.target_audience] ?? "your program";

  await Promise.allSettled(
    (students ?? []).map((s: { full_name: string; email: string }) =>
      sendZoomLinkEmail({
        to: s.email,
        studentName: s.full_name,
        sessionTitle: session.title,
        description: session.description,
        zoomUrl: session.zoom_url,
        programName,
      })
    )
  );

  await admin.from("zoom_sessions").update({ last_sent_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/zoom");
}

export async function recordZoomAttendance(formData: FormData) {
  const recorder = await requireRole(["admin", "professor"]);
  const admin = createAdminClient();

  const sessionId = String(formData.get("session_id") || "");
  const sessionDate = String(formData.get("session_date") || new Date().toISOString().slice(0, 10));
  const presentIds = new Set(formData.getAll("present").map(String));

  // Fetch all student IDs for this session from the submitted hidden inputs
  const allStudentIds = formData.getAll("student_id").map(String);
  if (!sessionId || allStudentIds.length === 0) return;

  const rows = allStudentIds.map((studentId) => ({
    zoom_session_id: sessionId,
    student_id: studentId,
    session_date: sessionDate,
    present: presentIds.has(studentId),
    recorded_by: recorder.id,
  }));

  await admin.from("zoom_attendance").upsert(rows, {
    onConflict: "zoom_session_id,student_id,session_date",
  });

  const returnPath = String(formData.get("return_path") || `/admin/zoom/${sessionId}/attendance`);
  revalidatePath(`/admin/zoom/${sessionId}/attendance`);
  revalidatePath(`/professor/zoom-attendance/${sessionId}`);
  redirect(`${returnPath}?saved=1`);
}
