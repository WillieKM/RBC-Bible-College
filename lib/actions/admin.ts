"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountInviteEmail } from "@/lib/email";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── Cohorts ────────────────────────────────────────────────────────────

export async function createCohort(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("start_date") || "") || null;
  const endDate = String(formData.get("end_date") || "") || null;
  if (!name) return;

  await supabase.from("cohorts").insert({ name, start_date: startDate, end_date: endDate });
  revalidatePath("/admin/cohorts");
}

export async function deleteCohort(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("cohorts").delete().eq("id", id);
  revalidatePath("/admin/cohorts");
}

// ─── Courses ────────────────────────────────────────────────────────────

export async function createCourse(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const code = String(formData.get("code") || "").trim() || null;
  const cohortId = String(formData.get("cohort_id") || "") || null;
  const professorId = String(formData.get("professor_id") || "") || null;
  if (!title) return;

  await supabase.from("courses").insert({ title, code, cohort_id: cohortId, professor_id: professorId });
  revalidatePath("/admin/courses");
}

export async function deleteCourse(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/admin/courses");
}

export async function enrollStudent(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const courseId = String(formData.get("course_id"));
  const studentId = String(formData.get("student_id"));
  if (!studentId) return;

  await supabase.from("enrollments").insert({ course_id: courseId, student_id: studentId });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function unenrollStudent(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const courseId = String(formData.get("course_id"));
  const enrollmentId = String(formData.get("enrollment_id"));

  await supabase.from("enrollments").delete().eq("id", enrollmentId);
  revalidatePath(`/admin/courses/${courseId}`);
}

// ─── Users ──────────────────────────────────────────────────────────────

export async function inviteUser(formData: FormData) {
  await requireRole(["admin"]);

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const role = String(formData.get("role") || "");
  if (!fullName || !email || !["admin", "professor", "student"].includes(role)) return;

  const admin = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${baseUrl}/login`,
  });
  if (error) {
    revalidatePath("/admin/users");
    return;
  }

  await admin.from("profiles").insert({ id: invited.user.id, full_name: fullName, email, role });
  await sendAccountInviteEmail({ to: email, fullName, role, loginUrl: `${baseUrl}/login` });

  revalidatePath("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (!["admin", "professor", "student"].includes(role)) return;

  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/users");
}
