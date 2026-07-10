import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/student";

  const supabase = await createClient();

  // OTP hash flow (recovery, invite, magic links) — try first because it
  // does NOT need a PKCE verifier, making it reliable for server-generated links.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "recovery" | "signup" | "email" | "invite",
      token_hash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // PKCE flow (OAuth and some Supabase PKCE-mode email links)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+link.+Please+try+again.`);
}
