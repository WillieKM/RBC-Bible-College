"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(formData: FormData) {
  const profile = await requireRole(["admin", "professor"]);
  const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const target = String(formData.get("target") || "all") as "all" | "students" | "professors";
  if (!title || !body) return;

  await supabase.from("announcements").insert({ title, body, target, author_id: profile.id });
  revalidatePath("/admin/announcements");
  revalidatePath("/student");
  revalidatePath("/professor");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/student");
  revalidatePath("/professor");
}
