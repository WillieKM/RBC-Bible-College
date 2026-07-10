import { Suspense } from "react";
import Image from "next/image";
import { AuthCodeHandler } from "./AuthCodeHandler";

export default function NewPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={72} height={72} className="rounded-full" />
          <h1 className="mt-4 text-xl font-bold text-gold">Set New Password</h1>
          <p className="mt-1 text-sm text-slate-400">Choose a strong password for your account.</p>
        </div>

        {/*
          AuthCodeHandler detects what's in the URL (or lack thereof) entirely
          client-side, so it handles all Supabase auth redirect formats:
          - ?token_hash=...&type=... (OTP hash)
          - ?code=... (PKCE code)
          - #access_token=... (implicit / hash fragment)
          - nothing (already signed in, or show expired message)
        */}
        <Suspense fallback={
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <p className="text-sm text-slate-400">Verifying your link…</p>
          </div>
        }>
          <AuthCodeHandler />
        </Suspense>
      </div>
    </div>
  );
}
