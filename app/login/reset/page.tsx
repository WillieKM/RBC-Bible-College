import { sendPasswordReset } from "@/lib/actions/auth";
import Image from "next/image";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={72} height={72} className="rounded-full" />
          <h1 className="mt-4 text-xl font-bold text-gold">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-400">
            {sent ? "Check your email for a reset link." : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="mt-6 rounded-lg bg-green-950 border border-green-800 px-3 py-3 text-sm text-green-300 text-center">
            Reset link sent. Check your inbox (and spam folder).
          </div>
        ) : (
          <form action={sendPasswordReset} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              Send reset link
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="text-gold hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
