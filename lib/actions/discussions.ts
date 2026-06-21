"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function postDiscussion(formData: FormData) {
  const profile = await requireRole(["student", "professor", "admin"]);
  const supabase = await createClient();

  const courseId = String(formData.get("course_id"));
  const parentId = String(formData.get("parent_id") || "") || null;
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  await supabase.from("course_discussions").insert({
    course_id: courseId,
    author_id: profile.id,
    parent_id: parentId,
    body,
  });

  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/professor/courses/${courseId}`);
}

export async function deleteDiscussion(formData: FormData) {
  const profile = await requireRole(["student", "professor", "admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const courseId = String(formData.get("course_id"));

  const { data: post } = await supabase.from("course_discussions").select("author_id").eq("id", id).single();
  if (!post) return;
  if (post.author_id !== profile.id && profile.role !== "admin") return;

  await supabase.from("course_discussions").delete().eq("id", id);
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath(`/professor/courses/${courseId}`);
}
