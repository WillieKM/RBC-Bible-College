"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendNewApplicationEmail,
  sendApplicationDecisionEmail,
  sendAccountInviteEmail,
  sendAccreditationEmail,
} from "@/lib/email";
import { requireRole } from "@/lib/auth";
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
    details,
  });

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  await sendNewApplicationEmail({ fullName, email, phone: phone || null, program, statement });

  if (source === "tbcs") {
    await sendAccreditationEmail({ to: email, fullName, program });
  }

  redirect(`${returnTo}?success=1`);
}

export async function reviewApplication(formData: FormData) {
  await requireRole(["admin"]);

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

    await admin.from("profiles").insert({
      id: invited.user.id,
      full_name: application.full_name,
      email: application.email,
      role: "student",
    });

    await supabase
      .from("applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), cohort_id: cohortId })
      .eq("id", id);

    await sendApplicationDecisionEmail({ to: application.email, fullName: application.full_name, approved: true, loginUrl: `${baseUrl}/login` });
    await sendAccountInviteEmail({ to: application.email, fullName: application.full_name, role: "student", loginUrl: `${baseUrl}/login` });
  } else {
    await supabase
      .from("applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    await sendApplicationDecisionEmail({ to: application.email, fullName: application.full_name, approved: false });
  }

  revalidatePath("/admin/applications");
}
