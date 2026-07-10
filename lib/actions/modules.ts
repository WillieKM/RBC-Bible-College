"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendModuleFileEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ModuleAudience = "all" | "diploma" | "bachelors" | "masters" | "doctorate" | string;

function filenameToTitle(name: string): string {
  return name
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export async function uploadModule(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const admin = createAdminClient();

  const manualTitle = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;

  // getAll supports both single and multiple file selections
  const files = (formData.getAll("file") as File[]).filter((f) => f instanceof File && f.size > 0);

  if (files.length === 0) return;

  const MAX_BYTES = 50 * 1024 * 1024; // 50MB per file
  const oversized = files.find((f) => f.size > MAX_BYTES);
  if (oversized) {
    redirect(`/admin/modules?error=${encodeURIComponent(`"${oversized.name}" exceeds the 50 MB limit`)}`);
  }

  const rows: { title: string; description: string | null; file_url: string; file_name: string; uploaded_by: string }[] = [];

  for (const file of files) {
    const title = files.length === 1 && manualTitle ? manualTitle : filenameToTitle(file.name);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;

    const { error: uploadError } = await admin.storage
      .from("module-files")
      .upload(path, file, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      redirect(`/admin/modules?error=${encodeURIComponent(`Failed to upload "${file.name}": ${uploadError.message}`)}`);
    }

    const { data: publicUrl } = admin.storage.from("module-files").getPublicUrl(path);
    rows.push({ title, description, file_url: publicUrl.publicUrl, file_name: file.name, uploaded_by: profile.id });
  }

  await admin.from("module_files").insert(rows);

  revalidatePath("/admin/modules");
  revalidatePath("/professor/modules");
  revalidatePath("/student/modules");
}

export async function updateModule(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const sendAtRaw = String(formData.get("send_at") || "").trim();
  const sendAudience = String(formData.get("send_audience") || "").trim() || null;

  if (!id || !title) return;

  // Clear schedule if date/time field is blank; otherwise parse as UTC
  const sendAt = sendAtRaw ? new Date(sendAtRaw).toISOString() : null;

  await admin.from("module_files").update({
    title,
    description,
    send_at: sendAt,
    send_audience: sendAt ? (sendAudience ?? "all") : null,
    // Reset sent_at so a re-schedule is picked up again by the cron
    ...(sendAt ? { sent_at: null } : {}),
  }).eq("id", id);

  revalidatePath("/admin/modules");
  revalidatePath("/professor/modules");
  revalidatePath("/student/modules");
  redirect("/admin/modules");
}

export async function deleteModule(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();

  const id = String(formData.get("id"));
  const fileUrl = String(formData.get("file_url") || "");

  // Extract the storage path from the public URL to delete the file
  const bucketPrefix = "/storage/v1/object/public/module-files/";
  const idx = fileUrl.indexOf(bucketPrefix);
  if (idx !== -1) {
    const storagePath = fileUrl.slice(idx + bucketPrefix.length);
    await admin.storage.from("module-files").remove([storagePath]);
  }

  await admin.from("module_files").delete().eq("id", id);

  revalidatePath("/admin/modules");
  revalidatePath("/professor/modules");
  revalidatePath("/student/modules");
}

/** Returns the students and program-matched professors for a given audience. */
async function resolveRecipients(
  admin: ReturnType<typeof createAdminClient>,
  audience: ModuleAudience
): Promise<{ students: { full_name: string; email: string }[]; professors: { full_name: string; email: string }[] }> {
  if (audience.startsWith("prof:")) {
    const profId = audience.slice(5);
    const { data: prof } = await admin.from("profiles").select("full_name, email").eq("id", profId).maybeSingle();
    return { students: [], professors: prof ? [prof] : [] };
  }

  if (audience === "all") {
    const [{ data: students }, { data: professors }] = await Promise.all([
      admin.from("profiles").select("full_name, email").eq("role", "student"),
      admin.from("profiles").select("full_name, email").eq("role", "professor"),
    ]);
    return { students: students ?? [], professors: professors ?? [] };
  }

  const { data: matchingPrograms } = await admin
    .from("programs")
    .select("id")
    .eq("program_level", audience);

  const programIds = (matchingPrograms ?? []).map((p: { id: string }) => p.id);
  const noMatch = ["00000000-0000-0000-0000-000000000000"];

  const [{ data: students }, { data: programCourses }] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, email")
      .eq("role", "student")
      .in("program_id", programIds.length > 0 ? programIds : noMatch),
    programIds.length > 0
      ? admin
          .from("courses")
          .select("professor_id, profiles!professor_id(full_name, email)")
          .in("program_id", programIds)
          .not("professor_id", "is", null)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  // Deduplicate — a professor teaching multiple courses in the same program appears once
  const seen = new Set<string>();
  const professors: { full_name: string; email: string }[] = [];
  for (const course of (programCourses ?? []) as unknown as { professor_id: string; profiles: { full_name: string; email: string } | null }[]) {
    if (course.professor_id && !seen.has(course.professor_id) && course.profiles) {
      seen.add(course.professor_id);
      professors.push(course.profiles);
    }
  }

  return { students: students ?? [], professors };
}

export async function sendModuleNow(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();

  const moduleId = String(formData.get("module_id") || "");
  const audience = String(formData.get("send_audience") || "all") as ModuleAudience;

  if (!moduleId) return;

  const { data: module } = await admin
    .from("module_files")
    .select("title, description, file_url, file_name")
    .eq("id", moduleId)
    .single();

  if (!module) return;

  const { students, professors } = await resolveRecipients(admin, audience);

  const recipients = [
    ...students,
    ...professors,
  ] as { full_name: string; email: string }[];

  await Promise.allSettled(
    recipients.map((r) =>
      sendModuleFileEmail({
        to: r.email,
        studentName: r.full_name,
        moduleTitle: module.title,
        description: module.description,
        fileUrl: module.file_url,
        fileName: module.file_name,
        senderName: "Revelation Bible College",
      })
    )
  );

  await admin
    .from("module_files")
    .update({ sent_at: new Date().toISOString(), send_audience: audience })
    .eq("id", moduleId);

  revalidatePath("/admin/modules");
  revalidatePath("/student/modules");
  revalidatePath("/professor/modules");
  redirect(`/admin/modules?sent=${recipients.length}`);
}
