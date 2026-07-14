"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { redeemInviteToken } from "@/lib/actions/invite";

function InviteContent() {
  const params = useSearchParams();
  const token = params.get("t") ?? "";
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleAccept() {
    if (!token) {
      setErrorMsg("Invalid invitation link.");
      setStatus("error");
      return;
    }
    setStatus("working");

    const result = await redeemInviteToken(token);
    if ("error" in result) {
      setErrorMsg(result.error);
      setStatus("error");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: result.type as "recovery",
      token_hash: result.hashed_token,
    });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }

    router.replace("/settings/new-password");
  }

  if (status === "error") {
    return (
      <div className="mt-6 space-y-3">
        <div className="rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
          {errorMsg}
        </div>
        <a href="/login" className="block text-center text-xs text-slate-500 hover:text-slate-400">
          Sign in instead
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-slate-400 text-center">
        You&apos;ve been invited to join Revelation Bible College International.
        Click below to set your password and activate your account.
      </p>
      <button
        onClick={handleAccept}
        disabled={status === "working"}
        className="w-full rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
      >
        {status === "working" ? "Verifying…" : "Accept Invitation & Set Password →"}
      </button>
      <a href="/login" className="block text-center text-xs text-slate-500 hover:text-slate-400">
        Already have a password? Sign in instead
      </a>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.jpg"
            alt="Revelation Bible College International"
            width={72}
            height={72}
            className="rounded-full"
          />
          <h1 className="mt-4 text-xl font-bold text-gold">You&apos;re Invited</h1>
          <p className="mt-1 text-sm text-slate-400">Revelation Bible College International</p>
        </div>
        <Suspense fallback={
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        }>
          <InviteContent />
        </Suspense>
      </div>
    </div>
  );
}
