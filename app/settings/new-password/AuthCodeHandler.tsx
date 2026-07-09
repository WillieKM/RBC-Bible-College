"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthCodeHandler() {
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!code && !token_hash) return;

    setStatus("processing");
    const supabase = createClient();

    const handle = async () => {
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

      setStatus("done");
      // Strip auth params from URL then do a hard reload so the Server Component
      // picks up the new session from cookies set by the browser Supabase client
      router.replace("/settings/new-password");
      router.refresh();
    };

    handle();
  }, [searchParams, router]);

  if (status === "processing") {
    return (
      <div className="mt-4 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 text-center">
        Verifying your link…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
          This link has expired or already been used.
        </div>
        <a
          href="/login/reset"
          className="block w-full rounded-lg border border-gold/30 px-4 py-2 text-center text-sm font-medium text-gold hover:bg-gold/10"
        >
          Request a new link
        </a>
      </div>
    );
  }

  return null;
}
