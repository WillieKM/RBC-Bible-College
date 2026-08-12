"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(formData: FormData) {
  const profile = await requireRole(["admin", "professor"]);
  const supabase = await createClient();
  const admin = createAdminClient();

  const title  = String(formData.get("title") || "").trim();
  const body   = String(formData.get("body")  || "").trim();
  const target = String(formData.get("target") || "all") as "all" | "students" | "professors";
  if (!title || !body) return;

  await supabase.from("announcements").insert({ title, body, target, author_id: profile.id });

  // Push a notification to every affected user
  const roles =
    target === "students"   ? ["student"] :
    target === "professors" ? ["professor"] :
    ["student", "professor"];

  const { data: recipients } = await admin
    .from("profiles")
    .select("id, role")
    .in("role", roles);

  if (recipients && recipients.length > 0) {
    await admin.from("notifications").insert(
      recipients.map((r: { id: string; role: string }) => ({
        user_id: r.id,
        title: `📢 ${title}`,
        body,
        link: r.role === "professor" ? "/professor/announcements" : "/student/announcements",
      }))
    );
  }

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
