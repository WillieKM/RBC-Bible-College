import Image from "next/image";
import Link from "next/link";

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; email?: string; program?: string }>;
}) {
  const { name, email, program } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-ink-light p-10 shadow-xl border border-gold/20 text-center">

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo.jpg"
            alt="Revelation Bible College International"
            width={88}
            height={88}
            className="rounded-full ring-4 ring-gold/30"
          />
        </div>

        {/* Checkmark */}
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/40 border border-green-700">
          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-gold">Application Submitted!</h1>

        {name && (
          <p className="mt-2 text-slate-300">
            Thank you, <strong className="text-slate-100">{name}</strong>.
          </p>
        )}

        {program && (
          <p className="mt-1 text-sm text-slate-400">
            Program applied for: <span className="font-semibold text-slate-300">{program}</span>
          </p>
        )}

        {email && (
          <div className="mt-4 rounded-lg border border-gold/20 bg-ink px-4 py-3 text-sm text-slate-300">
            A confirmation email has been sent to{" "}
            <span className="font-semibold text-gold">{email}</span>.
            <br />
            <span className="text-xs text-slate-500">Check your spam folder if you don&apos;t see it.</span>
          </div>
        )}

        {/* What happens next */}
        <div className="mt-6 rounded-xl border border-gold/20 bg-ink p-5 text-left">
          <p className="text-sm font-semibold text-gold">What happens next</p>
          <ol className="mt-3 space-y-3 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">1</span>
              Our admissions team will review your application.
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">2</span>
              You will receive an email with our decision and next steps.
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">3</span>
              Once approved, you will get login details to access your Student Portal.
            </li>
          </ol>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-lg border border-gold/40 px-6 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
