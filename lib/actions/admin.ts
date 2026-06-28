"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountInviteEmail, sendCompletionEmail, sendBulkAnnouncementEmail } from "@/lib/email";
import { requireRole, requireFinanceAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type SupabaseClient = ReturnType<typeof createClient> extends Promise<infer T> ? T : never;

export async function enrollStudentInProgramModules(supabase: SupabaseClient, studentId: string, programId: string) {
  const { data: modules } = await supabase.from("courses").select("id").eq("program_id", programId);
  if (!modules || modules.length === 0) return;

  await supabase
    .from("enrollments")
    .upsert(
      modules.map((m) => ({ course_id: m.id, student_id: studentId })),
      { onConflict: "course_id,student_id", ignoreDuplicates: true }
    );
}

// ─── Programs ───────────────────────────────────────────────────────────

export async function createProgram(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const programLevel = String(formData.get("program_level") || "diploma");
  if (!name || !["diploma", "bachelors", "masters", "doctorate"].includes(programLevel)) return;

  await supabase.from("programs").insert({ name, program_level: programLevel });
  revalidatePath("/admin/programs");
}

export async function deleteProgram(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("programs").delete().eq("id", id);
  revalidatePath("/admin/programs");
}

export async function assignProgramProfessor(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const professorId = String(formData.get("professor_id") || "") || null;

  await supabase.from("programs").update({ professor_id: professorId }).eq("id", id);
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${id}`);
}

export async function updateProgramFee(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));

  function parseFee(key: string): number | null {
    const s = String(formData.get(key) || "").trim();
    if (s === "") return null;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  await supabase.from("programs").update({
    fee_international: parseFee("fee_international"),
    fee_usa: parseFee("fee_usa"),
  }).eq("id", id);
  revalidatePath(`/admin/programs/${id}`);
  revalidatePath("/admin/programs");
}

export async function updateStudentProgram(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const programId = String(formData.get("program_id") || "") || null;

  await supabase.from("profiles").update({ program_id: programId }).eq("id", id);

  if (programId) {
    await enrollStudentInProgramModules(supabase, id, programId);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
}

export async function enrollProgramInModules(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const programId = String(formData.get("program_id"));

  const { data: students } = await supabase.from("profiles").select("id").eq("role", "student").eq("program_id", programId);
  for (const student of students ?? []) {
    await enrollStudentInProgramModules(supabase, student.id, programId);
  }

  revalidatePath(`/admin/programs/${programId}`);
}

// ─── Courses ────────────────────────────────────────────────────────────

export async function createCourse(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const code = String(formData.get("code") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const credits = String(formData.get("credits") || "").trim();
  const programId = String(formData.get("program_id") || "") || null;
  const professorId = String(formData.get("professor_id") || "") || null;
  if (!title) return;

  const { data: course } = await supabase
    .from("courses")
    .insert({
      title,
      code,
      description,
      credits: credits ? Number(credits) : null,
      program_id: programId,
      professor_id: professorId,
    })
    .select("id")
    .single();

  if (programId && course) {
    const { data: students } = await supabase.from("profiles").select("id").eq("role", "student").eq("program_id", programId);
    if (students && students.length > 0) {
      await supabase
        .from("enrollments")
        .upsert(
          students.map((s) => ({ course_id: course.id, student_id: s.id })),
          { onConflict: "course_id,student_id", ignoreDuplicates: true }
        );
    }
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
}

export async function updateCourse(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const code = String(formData.get("code") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const credits = String(formData.get("credits") || "").trim();
  const programId = String(formData.get("program_id") || "") || null;
  const professorId = String(formData.get("professor_id") || "") || null;
  const prerequisiteId = String(formData.get("prerequisite_id") || "") || null;
  const releaseDaysRaw = String(formData.get("release_days") || "").trim();
  const releaseDays = releaseDaysRaw !== "" ? Number(releaseDaysRaw) : null;
  if (!title) return;

  await supabase
    .from("courses")
    .update({
      title,
      code,
      description,
      credits: credits ? Number(credits) : null,
      program_id: programId,
      professor_id: professorId,
      prerequisite_id: prerequisiteId,
      release_days: releaseDays,
    })
    .eq("id", id);

  if (programId) {
    const { data: students } = await supabase.from("profiles").select("id").eq("role", "student").eq("program_id", programId);
    if (students && students.length > 0) {
      await supabase
        .from("enrollments")
        .upsert(
          students.map((s) => ({ course_id: id, student_id: s.id })),
          { onConflict: "course_id,student_id", ignoreDuplicates: true }
        );
    }
  }

  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/admin/courses");
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
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

  // generateLink creates the user and returns the link without sending Supabase's
  // own (heavily rate-limited) invite email — we deliver the link ourselves below.
  const { data: invited, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${baseUrl}/login` },
  });
  if (error || !invited?.user) {
    revalidatePath("/admin/users");
    return;
  }

  await admin.from("profiles").insert({ id: invited.user.id, full_name: fullName, email, role });
  await sendAccountInviteEmail({ to: email, fullName, role, loginUrl: invited.properties.action_link });

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

// Only an admin who already has finance_access can grant or revoke it for
// others — otherwise any admin could self-escalate via this form.
export async function updateFinanceAccess(formData: FormData) {
  await requireFinanceAccess();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const financeAccess = formData.get("finance_access") === "1";

  await supabase.from("profiles").update({ finance_access: financeAccess }).eq("id", id);
  revalidatePath("/admin/users");
}

export async function deleteApplication(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  await admin.from("applications").delete().eq("id", id);
  revalidatePath("/admin/applications");
}

export async function resendInvite(formData: FormData) {
  await requireRole(["admin"]);
  const email = String(formData.get("email") || "").trim();
  if (!email) return;

  const admin = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const { data: profile } = await admin.from("profiles").select("full_name, role").eq("email", email).maybeSingle();
  const { data: invited, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${baseUrl}/login` },
  });

  if (!error && invited?.properties.action_link) {
    await sendAccountInviteEmail({
      to: email,
      fullName: profile?.full_name ?? email,
      role: profile?.role ?? "user",
      loginUrl: invited.properties.action_link,
    });
  }

  revalidatePath("/admin/users");
}

export async function updateStudentProfile(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const fullName = String(formData.get("full_name") || "").trim();
  const studentNumber = String(formData.get("student_number") || "").trim() || null;
  const region = String(formData.get("region") || "international");
  const programId = String(formData.get("program_id") || "") || null;

  if (!fullName) return;

  await admin.from("profiles").update({
    full_name: fullName,
    student_number: studentNumber,
    region,
    program_id: programId,
  }).eq("id", id);

  if (programId) {
    await enrollStudentInProgramModules(admin, id, programId);
  }

  revalidatePath(`/admin/students/${id}`);
  revalidatePath("/admin/students");
}

export async function updatePaymentStatus(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("payment_status"));
  if (!["unpaid", "partial", "paid"].includes(status)) return;
  await supabase.from("profiles").update({ payment_status: status }).eq("id", id);
  revalidatePath("/admin/students");
}

export async function markProgramComplete(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const undo = formData.get("undo") === "1";

  const completedAt = undo ? null : new Date().toISOString();
  await supabase.from("profiles").update({ completed_at: completedAt }).eq("id", id);

  if (!undo) {
    const { data: student } = await supabase.from("profiles").select("*, programs(name)").eq("id", id).single();
    if (student) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const programName = (student as unknown as { programs?: { name: string } }).programs?.name ?? "your program";
      void sendCompletionEmail({
        to: student.email,
        studentName: student.full_name,
        programName,
        studentNumber: student.student_number,
        portalUrl: `${baseUrl}/student`,
      });
    }
  }

  revalidatePath("/admin/students");
}

export async function sendBulkEmail(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const target = String(formData.get("target") || "students");
  if (!title || !body) return;

  let query = supabase.from("profiles").select("email");
  if (target === "students") query = query.eq("role", "student");
  else if (target === "professors") query = query.eq("role", "professor");
  else query = query.in("role", ["student", "professor"]);

  const { data: recipients } = await query;
  if (!recipients || recipients.length === 0) return;

  void sendBulkAnnouncementEmail({ to: recipients.map((r) => r.email), title, body });
  revalidatePath("/admin/announcements");
}
