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
import { DEGREE_PROGRAM_LEVELS, feeForLevel } from "@/lib/fees";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
  "website",
]);

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const RATE_LIMIT_WINDOW_MINUTES = 30;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") || "unknown";
}

export async function submitApplication(formData: FormData) {
  const source = String(formData.get("source") || "").trim();
  const region = String(formData.get("region") || "").trim() || null;
  const returnTo = source === "tbcs" ? "/apply/degree" : "/apply";

  // Honeypot: a real applicant never fills this hidden field. Pretend to
  // succeed so bots don't learn to avoid it, but skip all real processing.
  if (String(formData.get("website") || "").trim()) {
    const params = new URLSearchParams({
      name: String(formData.get("full_name") || ""),
      email: String(formData.get("email") || ""),
      program: String(formData.get("program") || ""),
    });
    redirect(`/apply/success?${params.toString()}`);
  }

  const ip = await getClientIp();
  const adminClient = createAdminClient();

  await adminClient.from("application_attempts").insert({ ip });
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count: recentAttempts } = await adminClient
    .from("application_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);

  if ((recentAttempts ?? 0) > RATE_LIMIT_MAX_ATTEMPTS) {
    redirect(`${returnTo}?notice=${encodeURIComponent("Too many submissions detected from your network. Please wait a while before trying again, or email admissions directly.")}`);
  }

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
  const programLevel = source === "tbcs" ? (DEGREE_PROGRAM_LEVELS[program] ?? "bachelors") : "diploma";
  const statement = String(formData.get("statement") || "").trim() || null;
  const declarationAccepted = formData.get("declaration_accepted") === "on";

  if (!fullName || !email || !program) {
    redirect(`${returnTo}?error=Please+fill+in+all+required+fields`);
  }

  if (!declarationAccepted) {
    redirect(`${returnTo}?error=You+must+agree+to+the+declaration+to+apply`);
  }

  const photo = formData.get("passport_photo");
  if (photo instanceof File && photo.size > MAX_PHOTO_BYTES) {
    redirect(`${returnTo}?error=Photo+must+be+smaller+than+5MB`);
  }

  // Applications RLS restricts reads to admins, so this existence check needs
  // the service-role client even though the insert below uses the anon client.
  const { data: existing } = await adminClient
    .from("applications")
    .select("status")
    .eq("email", email)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status === "pending") {
    redirect(`${returnTo}?notice=${encodeURIComponent("You already have an application under review with this email. We'll email you as soon as a decision is made — no need to apply again.")}`);
  }
  if (existing?.status === "approved") {
    redirect(`${returnTo}?notice=${encodeURIComponent("An application with this email has already been approved. Check your inbox for login details, or contact admissions if you need help.")}`);
  }

  const details: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (TOP_LEVEL_FORM_KEYS.has(key)) continue;
    const values = formData.getAll(key).map((v) => String(v));
    details[key] = values.length > 1 ? values : values[0];
  }

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await adminClient.storage
      .from("application-photos")
      .upload(path, photo, { contentType: photo.type });

    if (!uploadError) {
      const { data: publicUrl } = adminClient.storage.from("application-photos").getPublicUrl(path);
      photoUrl = publicUrl.publicUrl;
    }
  }

  const supabase = await createClient();

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

    // generateLink creates the user and returns the link without sending Supabase's
    // own (heavily rate-limited) invite email — we deliver the link ourselves below.
    const { data: invited, error: inviteError } = await admin.auth.admin.generateLink({
      type: "invite",
      email: application.email,
      options: { redirectTo: `${baseUrl}/login` },
    });

    if (inviteError || !invited?.user) {
      redirect(`/admin/applications?error=${encodeURIComponent(inviteError?.message ?? "Could not create account")}`);
    }

    const studentRegion = application.region ?? "international"; // "usa" | "international"

    let programId: string | null = null;
    let programFeeIntl: number | null = null;
    let programFeeUsa: number | null = null;
    if (application.program) {
      const { data: existingProgram } = await admin
        .from("programs")
        .select("id, fee_international, fee_usa")
        .eq("name", application.program)
        .maybeSingle();

      if (existingProgram) {
        programId = existingProgram.id;
        programFeeIntl = existingProgram.fee_international ?? null;
        programFeeUsa = existingProgram.fee_usa ?? null;
      } else {
        const { data: newProgram } = await admin
          .from("programs")
          .insert({ name: application.program, program_level: application.program_level })
          .select("id, fee_international, fee_usa")
          .single();
        programId = newProgram?.id ?? null;
        programFeeIntl = newProgram?.fee_international ?? null;
        programFeeUsa = newProgram?.fee_usa ?? null;
      }
    }

    // Use the program's manually-set fee if an admin configured one, otherwise
    // fall back to the standard fee schedule for this program's tier.
    const programFee =
      (studentRegion === "usa" ? programFeeUsa : programFeeIntl) ??
      feeForLevel(application.program_level, studentRegion === "usa" ? "usa" : "international");

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
      region: studentRegion,
    });

    if (programId) {
      await enrollStudentInProgramModules(admin, invited.user.id, programId);
    }

    // Auto-create fee invoice if the program has a fee set for this student's region
    if (programFee && programFee > 0) {
      const invYear = new Date().getFullYear();
      const { count: invCount } = await admin
        .from("invoices")
        .select("id", { count: "exact", head: true });
      const invoiceNumber = `INV-${invYear}-${String((invCount ?? 0) + 1).padStart(4, "0")}`;
      const currency = studentRegion === "usa" ? "$" : "KSh";
      await admin.from("invoices").insert({
        student_id: invited.user.id,
        title: `${application.program} — Program Fees`,
        description: `Tuition and program fees for ${application.program} (${studentRegion === "usa" ? "USA" : "International"} rate: ${currency}${programFee.toLocaleString()})`,
        total_amount: programFee,
        invoice_number: invoiceNumber,
      });
    }

    await supabase
      .from("applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    void sendApplicationDecisionEmail({ to: application.email, fullName: application.full_name, approved: true, loginUrl: invited.properties.action_link, studentNumber });
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
