"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendNewApplicationEmail,
  sendNewApplicationToProfessorEmail,
  sendApplicationDecisionEmail,
  sendApplicationConfirmationEmail,
  sendAccreditationEmail,
} from "@/lib/email";
import { requireRole } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { enrollStudentInProgramModules } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const TOP_LEVEL_FORM_KEYS = new Set([
  "full_name",
  "email",
  "phone",
  "program",
  "region",
  "source",
  "statement",
  "declaration_accepted",
  "title",
  "first_name",
  "middle_name",
  "surname",
  "mobile_number",
  "email_personal",
  "passport_photo",
]);

export async function submitApplication(formData: FormData) {
  const source = String(formData.get("source") || "").trim();
  const region = String(formData.get("region") || "").trim() || null;
  const returnTo = source === "tbcs" ? "/apply/degree" : "/apply";

  let fullName = String(formData.get("full_name") || "").trim();
  if (!fullName) {
    fullName = [
      formData.get("title"),
      formData.get("first_name"),
      formData.get("middle_name"),
      formData.get("surname"),
    ]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(" ");
  }

  let email = String(formData.get("email") || "").trim();
  if (!email) email = String(formData.get("email_personal") || "").trim();

  let phone = String(formData.get("phone") || "").trim();
  if (!phone) phone = String(formData.get("mobile_number") || "").trim();

  const program = String(formData.get("program") || "").trim();
  const programLevel = source === "tbcs" ? "degree" : "diploma";
  const statement = String(formData.get("statement") || "").trim() || null;
  const declarationAccepted = formData.get("declaration_accepted") === "on";

  if (!fullName || !email || !program) {
    redirect(`${returnTo}?error=Please+fill+in+all+required+fields`);
  }

  if (!declarationAccepted) {
    redirect(`${returnTo}?error=You+must+agree+to+the+declaration+to+apply`);
  }

  const details: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (TOP_LEVEL_FORM_KEYS.has(key)) continue;
    const values = formData.getAll(key).map((v) => String(v));
    details[key] = values.length > 1 ? values : values[0];
  }

  let photoUrl: string | null = null;
  const photo = formData.get("passport_photo");
  if (photo instanceof File && photo.size > 0) {
    const admin = createAdminClient();
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("application-photos")
      .upload(path, photo, { contentType: photo.type });

    if (!uploadError) {
      const { data: publicUrl } = admin.storage.from("application-photos").getPublicUrl(path);
      photoUrl = publicUrl.publicUrl;
    }
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Delete any existing pending application from this email so we always keep the latest
  await adminClient
    .from("applications")
    .delete()
    .eq("email", email)
    .eq("status", "pending");

  const { error } = await supabase.from("applications").insert({
    full_name: fullName,
    email,
    phone: phone || null,
    program,
    program_level: programLevel,
    region,
    declaration_accepted: declarationAccepted,
    statement,
    photo_url: photoUrl,
    details,
  });

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  // Look up program professor in parallel with firing emails
  const { data: programRow } = await adminClient
    .from("programs")
    .select("professor_id, profiles(full_name, email)")
    .eq("name", program)
    .maybeSingle();

  const programProfessor = programRow?.profiles as unknown as { full_name: string; email: string } | null;

  // Fire all emails in parallel — allSettled means one failure won't crash the form
  await Promise.allSettled([
    // Confirmation to the applicant
    sendApplicationConfirmationEmail({ to: email, fullName, program, region }),
    // Notification to admissions
    sendNewApplicationEmail({ fullName, email, phone: phone || null, program, statement }),
    // Notification to program professor if assigned
    programRow?.professor_id && programProfessor?.email
      ? sendNewApplicationToProfessorEmail({
          to: programProfessor.email,
          professorName: programProfessor.full_name,
          fullName,
          email,
          phone: phone || null,
          program,
        })
      : Promise.resolve(),
    // TBCS accreditation confirmation
    source === "tbcs"
      ? sendAccreditationEmail({ to: email, fullName, program })
      : Promise.resolve(),
  ]);

  const params = new URLSearchParams({
    name: fullName,
    email,
    program,
  });
  redirect(`/apply/success?${params.toString()}`);
}

export async function reviewApplication(formData: FormData) {
  const adminProfile = await requireRole(["admin"]);

  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")); // "approve" | "reject"
  const cohortId = String(formData.get("cohort_id") || "") || null;

  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!application) redirect("/admin/applications");

  if (decision === "approve") {
    const admin = createAdminClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      application.email,
      { redirectTo: `${baseUrl}/login` }
    );

    if (inviteError) {
      redirect(`/admin/applications?error=${encodeURIComponent(inviteError.message)}`);
    }

    let programId: string | null = null;
    if (application.program) {
      const { data: existingProgram } = await admin
        .from("programs")
        .select("id")
        .eq("name", application.program)
        .maybeSingle();

      if (existingProgram) {
        programId = existingProgram.id;
      } else {
        const { data: newProgram } = await admin
          .from("programs")
          .insert({ name: application.program, program_level: application.program_level })
          .select("id")
          .single();
        programId = newProgram?.id ?? null;
      }
    }

    const year = new Date().getFullYear();
    const { count: studentCount } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .like("student_number", `RBC-${year}-%`);
    const studentNumber = `RBC-${year}-${String((studentCount ?? 0) + 1).padStart(4, "0")}`;

    await admin.from("profiles").insert({
      id: invited.user.id,
      full_name: application.full_name,
      email: application.email,
      role: "student",
      program_id: programId,
      student_number: studentNumber,
      avatar_url: application.photo_url ?? null,
    });

    if (programId) {
      await enrollStudentInProgramModules(admin, invited.user.id, programId);
    }

    await supabase
      .from("applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), cohort_id: cohortId })
      .eq("id", id);

    void sendApplicationDecisionEmail({ to: application.email, fullName: application.full_name, approved: true, loginUrl: `${baseUrl}/login`, studentNumber });
    void writeAuditLog({ actorId: adminProfile.id, actorName: adminProfile.full_name, action: "approve_application", targetType: "application", targetId: id, details: { applicant: application.full_name, email: application.email, program: application.program } });
  } else {
    await supabase
      .from("applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    void sendApplicationDecisionEmail({ to: application.email, fullName: application.full_name, approved: false });
    void writeAuditLog({ actorId: adminProfile.id, actorName: adminProfile.full_name, action: "reject_application", targetType: "application", targetId: id, details: { applicant: application.full_name, email: application.email } });
  }

  revalidatePath("/admin/applications");
}
