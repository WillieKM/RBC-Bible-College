"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createNotification(opts: {
  userId: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: opts.userId,
    title: opts.title,
    body: opts.body ?? null,
    link: opts.link ?? null,
  });
}

export async function markNotificationRead(formData: FormData) {
  const profile = await requireRole(["student", "professor", "admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", profile.id);
  revalidatePath("/student");
  revalidatePath("/professor");
  revalidatePath("/admin");
}

export async function markAllNotificationsRead(formData: FormData) {
  const profile = await requireRole(["student", "professor", "admin"]);
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id).eq("read", false);
  revalidatePath("/student");
  revalidatePath("/professor");
  revalidatePath("/admin");
}
