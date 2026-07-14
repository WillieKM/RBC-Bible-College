"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/site-url";
import { sendStudentWelcomeEmail } from "@/lib/email";

/** Creates a permanent invite record and returns the URL to embed in the email. */
export async function createInviteLink(email: string, fullName: string, role: string): Promise<string> {
  const admin = createAdminClient();
  const baseUrl = await getBaseUrl();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from("invite_links") as any)
    .insert({ email, full_name: fullName, role })
    .select("id")
    .single();

  return `${baseUrl}/auth/invite?t=${data.id}`;
}

/**
 * Called when the user clicks "Accept Invitation" on the invite page.
 * Looks up the permanent invite record and generates a fresh Supabase token.
 * The token is only generated at click-time, so email scanners never consume it.
 */
export async function redeemInviteToken(
  token: string
): Promise<{ hashed_token: string; type: string } | { error: string }> {
  const admin = createAdminClient();
  const baseUrl = await getBaseUrl();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invite } = await (admin.from("invite_links") as any)
    .select("email, role")
    .eq("id", token)
    .maybeSingle();

  if (!invite) return { error: "This invitation link is not valid or has been revoked." };

  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: invite.email,
    options: { redirectTo: `${baseUrl}/settings/new-password` },
  });

  if (error || !link?.properties?.hashed_token) {
    return { error: error?.message ?? "Could not generate a login link. Please contact an administrator." };
  }

  // Send welcome email to new students (fire-and-forget — don't block the redirect)
  if (invite.role === "student") {
    void sendWelcomeIfStudent(admin, invite.email, baseUrl);
  }

  return {
    hashed_token: link.properties.hashed_token,
    type: "recovery",
  };
}

async function sendWelcomeIfStudent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  email: string,
  baseUrl: string
) {
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, student_number, region, program_id")
      .eq("email", email)
      .maybeSingle();

    if (!profile?.program_id) return;

    const [{ data: program }, { data: modules }] = await Promise.all([
      admin
        .from("programs")
        .select("name, program_level, fee_international, fee_usa")
        .eq("id", profile.program_id)
        .maybeSingle(),
      admin
        .from("module_files")
        .select("title")
        .eq("program_id", profile.program_id),
    ]);

    if (!program) return;

    const region: string = profile.region ?? "international";
    const feeAmount: number | null =
      region === "usa"
        ? (program.fee_usa ?? null)
        : (program.fee_international ?? null);

    const courses: string[] = (modules ?? []).map((m: { title: string }) => m.title);

    await sendStudentWelcomeEmail({
      to: email,
      fullName: profile.full_name ?? "",
      studentNumber: profile.student_number ?? null,
      programName: program.name,
      programLevel: program.program_level ?? "diploma",
      courses,
      feeAmount,
      region,
      portalUrl: `${baseUrl}/student`,
    });
  } catch (err) {
    console.error("Welcome email failed:", err);
  }
}
