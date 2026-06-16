import { login } from "@/lib/actions/auth";
import Image from "next/image";

const PORTALS = {
  "/student":   { title: "Student Portal",   subtitle: "Sign in to access your modules and assignments" },
  "/professor": { title: "Professor Portal", subtitle: "Sign in to manage your courses and grade submissions" },
  "/admin":     { title: "Admin Sign In",    subtitle: "Sign in to manage the school" },
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  const portal = returnTo && returnTo in PORTALS ? PORTALS[returnTo as keyof typeof PORTALS] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={88} height={88} className="rounded-full" />
          <h1 className="mt-4 text-xl font-bold text-gold">{portal?.title ?? "Sign In"}</h1>
          <p className="mt-1 text-sm text-slate-400">{portal?.subtitle ?? "Sign in to continue"}</p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form action={login} className="mt-6 space-y-4">
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
