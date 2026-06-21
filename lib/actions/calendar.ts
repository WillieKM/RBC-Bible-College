"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const eventDate = String(formData.get("event_date") || "");
  const endDate = String(formData.get("end_date") || "") || null;
  const type = String(formData.get("type") || "other");
  if (!title || !eventDate) return;

  await supabase.from("events").insert({ title, description, event_date: eventDate, end_date: endDate, type, author_id: profile.id });
  revalidatePath("/admin/calendar");
  revalidatePath("/student");
  revalidatePath("/professor");
}

export async function deleteEvent(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/admin/calendar");
  revalidatePath("/student");
  revalidatePath("/professor");
}
