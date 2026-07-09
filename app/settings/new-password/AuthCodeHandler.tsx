"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/actions/auth";

export function AuthCodeHandler() {
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "error">("idle");
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasAuthParams =
    searchParams.has("code") ||
    (searchParams.has("token_hash") && searchParams.has("type"));

  useEffect(() => {
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!code && !token_hash) {
      setStatus("idle");
      return;
    }

    setStatus("processing");
    const supabase = createClient();

    (async () => {
      let error: unknown = null;

      if (code) {
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      } else if (token_hash && type) {
        ({ error } = await supabase.auth.verifyOtp({
          type: type as "recovery" | "invite" | "signup" | "email",
          token_hash,
        }));
      }

      if (error) {
        setStatus("error");
        return;
      }

      setStatus("ready");
      // Strip auth params so a page refresh doesn't re-run the exchange
      router.replace("/settings/new-password");
    })();
  }, [searchParams, router]);

  // No auth params in URL — page was loaded normally (already authenticated)
  if (!hasAuthParams && status === "idle") return null;

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="text-sm text-slate-400">Verifying your link…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3 py-4">
        <div className="rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
          This link has expired or already been used.
        </div>
        <a
          href="/login/reset"
          className="block w-full rounded-lg border border-gold/30 px-4 py-2 text-center text-sm font-medium text-gold hover:bg-gold/10"
        >
          Request a new link →
        </a>
      </div>
    );
  }

  // status === "ready" — session established, show the form
  if (status === "ready") {
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

  return null;
}
