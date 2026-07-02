"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendModuleFileEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ModuleAudience = "all" | "diploma" | "bachelors" | "masters" | "doctorate";

export async function uploadModule(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const admin = createAdminClient();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const file = formData.get("file") as File | null;

  if (!title || !file || file.size === 0) return;

  const MAX_BYTES = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_BYTES) {
    redirect("/admin/modules?error=File+must+be+smaller+than+50MB");
  }

  const ext = file.name.split(".").pop() ?? "pdf";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}_${safeName}`;

  const { error: uploadError } = await admin.storage
    .from("module-files")
    .upload(path, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    redirect(`/admin/modules?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: publicUrl } = admin.storage.from("module-files").getPublicUrl(path);

  await admin.from("module_files").insert({
    title,
    description,
    file_url: publicUrl.publicUrl,
    file_name: file.name,
    uploaded_by: profile.id,
  });

  revalidatePath("/admin/modules");
  revalidatePath("/professor/modules");
  revalidatePath("/student/modules");
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
