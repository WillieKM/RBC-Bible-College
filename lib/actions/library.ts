"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveLibraryResource(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const admin = createAdminClient();

  const id = String(formData.get("id") || "") || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const url = String(formData.get("url") || "").trim() || null;
  const category = String(formData.get("category") || "General").trim() || "General";
  if (!title) return;

  if (id) {
    await admin.from("library_resources").update({
      title, description, url, category,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
  } else {
    await admin.from("library_resources").insert({
      title, description, url, category, author_id: profile.id,
    });
  }

  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  revalidatePath("/professor/library");
}

export async function deleteLibraryResource(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  await admin.from("library_resources").delete().eq("id", id);
  revalidatePath("/admin/library");
  revalidatePath("/student/library");
  revalidatePath("/professor/library");
}
