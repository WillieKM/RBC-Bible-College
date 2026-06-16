import { updatePassword } from "@/lib/actions/auth";
import Image from "next/image";

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={72} height={72} className="rounded-full" />
          <h1 className="mt-4 text-xl font-bold text-gold">Set New Password</h1>
          <p className="mt-1 text-sm text-slate-400">Choose a strong password for your account.</p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form action={updatePassword} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">New password</label>
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
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
