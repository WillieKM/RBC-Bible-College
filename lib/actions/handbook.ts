"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveHandbookPage(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const id = String(formData.get("id") || "") || null;
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const section = String(formData.get("section") || "General").trim() || "General";
  const sortOrder = parseInt(String(formData.get("sort_order") || "0"), 10);
  if (!title || !body) return;

  if (id) {
    await supabase.from("handbook_pages").update({ title, body, section, sort_order: sortOrder, updated_at: new Date().toISOString() }).eq("id", id);
  } else {
    await supabase.from("handbook_pages").insert({ title, body, section, sort_order: sortOrder });
  }
  revalidatePath("/admin/handbook");
  revalidatePath("/student/handbook");
  revalidatePath("/professor/handbook");
}

export async function deleteHandbookPage(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("handbook_pages").delete().eq("id", id);
  revalidatePath("/admin/handbook");
  revalidatePath("/student/handbook");
}
