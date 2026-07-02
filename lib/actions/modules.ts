"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendModuleFileEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ModuleAudience = "all" | "diploma" | "bachelors" | "masters" | "doctorate";

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

  if (!id || !title) return;

  await admin.from("module_files").update({ title, description }).eq("id", id);

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

export async function sendModulesToStudents(formData: FormData) {
  const sender = await requireRole(["professor"]);
  const supabase = await createClient();
  const admin = createAdminClient();

  const moduleId = String(formData.get("module_id") || "");
  const audience = String(formData.get("audience") || "all") as ModuleAudience;

  if (!moduleId) return;

  const { data: module } = await admin
    .from("module_files")
    .select("title, description, file_url, file_name")
    .eq("id", moduleId)
    .single();

  if (!module) return;

  // Fetch matching students based on audience
  let studentQuery = supabase
    .from("profiles")
    .select("full_name, email, program_id")
    .eq("role", "student");

  if (audience !== "all") {
    const { data: matchingPrograms } = await supabase
      .from("programs")
      .select("id")
      .eq("program_level", audience);

    const programIds = (matchingPrograms ?? []).map((p) => p.id);
    if (programIds.length === 0) {
      redirect(`/professor/modules?sent=0`);
    }
    studentQuery = studentQuery.in("program_id", programIds);
  }

  const { data: students } = await studentQuery;
  if (!students || students.length === 0) {
    redirect(`/professor/modules?sent=0`);
  }

  // Fire emails in parallel batches — allSettled so one failure doesn't stop the rest
  await Promise.allSettled(
    students.map((s) =>
      sendModuleFileEmail({
        to: s.email,
        studentName: s.full_name,
        moduleTitle: module.title,
        description: module.description,
        fileUrl: module.file_url,
        fileName: module.file_name,
        senderName: sender.full_name,
      })
    )
  );

  redirect(`/professor/modules?sent=${students.length}`);
}
