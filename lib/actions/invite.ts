"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/site-url";

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
    .select("email")
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

  return {
    hashed_token: link.properties.hashed_token,
    type: "recovery",
  };
}
