"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/actions/auth";

type Status = "detecting" | "processing" | "ready" | "authenticated" | "error";

export function AuthCodeHandler() {
  const [status, setStatus] = useState<Status>("detecting");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();

    // Query-string params (PKCE code or OTP token_hash)
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    // Hash-fragment params (implicit flow: #access_token=...&refresh_token=...)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    const hasAuthParam = !!(code || token_hash || accessToken);

    if (!hasAuthParam) {
      // No incoming auth params — check whether user is already signed in
      supabase.auth.getUser().then(({ data: { user } }) => {
        setStatus(user ? "authenticated" : "error");
      });
      return;
    }

    setStatus("processing");

    (async () => {
      let authError: { message?: string } | null = null;

      if (accessToken && refreshToken) {
        ({ error: authError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }));
      } else if (token_hash && type) {
        ({ error: authError } = await supabase.auth.verifyOtp({
          type: type as "recovery" | "invite" | "signup" | "email",
          token_hash,
        }));
      } else if (code) {
        ({ error: authError } = await supabase.auth.exchangeCodeForSession(code));
      }

      if (authError) {
        setErrorDetail(`[${token_hash ? "token_hash" : accessToken ? "hash" : "code"}] ${authError.message ?? "Unknown error"}`);
        setStatus("error");
        return;
      }

      setStatus("ready");
      // Remove auth params from the URL so a refresh doesn't re-run the exchange
      router.replace("/settings/new-password");
    })();
  }, [searchParams, router]);

  if (status === "detecting" || status === "processing") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="text-sm text-slate-400">Verifying your link…</p>
      </div>
    );
  }

  if (status === "ready" || status === "authenticated") {
    return (
      <form action={updatePassword} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoFocus
            className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <p className="mt-1 text-xs text-slate-500">Minimum 8 characters</p>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
        >
          Set password
        </button>
      </form>
    );
  }

  // status === "error"
  return (
    <div className="mt-6 space-y-3">
      <div className="rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
        This link has expired or already been used.
        {errorDetail && <p className="mt-1 text-xs opacity-70">{errorDetail}</p>}
      </div>
      <a
        href="/login/reset"
        className="block w-full rounded-lg border border-gold/30 px-4 py-2 text-center text-sm font-medium text-gold hover:bg-gold/10"
      >
        Request a new link →
      </a>
      <a
        href="/login"
        className="block text-center text-xs text-slate-500 hover:text-slate-400"
      >
        Sign in instead
      </a>
    </div>
  );
}
