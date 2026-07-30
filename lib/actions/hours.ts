"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function logProfessorHours(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();

  const professorId = String(formData.get("professor_id") || "").trim();
  const date        = String(formData.get("date")         || "").trim();
  const hours       = parseFloat(String(formData.get("hours") || "0"));
  const category    = String(formData.get("category")     || "Teaching").trim();
  const description = String(formData.get("description")  || "").trim() || null;

  if (!professorId || !date || isNaN(hours) || hours <= 0) return;

  await admin.from("professor_hours").insert({ professor_id: professorId, date, hours, category, description });
  revalidatePath("/admin/hours");
}

export async function approveProfessorHours(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id"));

  await admin.from("professor_hours")
    .update({ approved: true, approved_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/hours");
}

export async function deleteProfessorHours(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id"));

  await admin.from("professor_hours").delete().eq("id", id);
  revalidatePath("/admin/hours");
}
