import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12 text-center">
      <Image src="/logo.jpg" alt="Revelation Bible College International" width={140} height={140} className="rounded-full" />
      <h1 className="mt-6 text-3xl font-bold text-gold">Revelation Bible College</h1>
      <p className="mt-1 text-sm uppercase tracking-widest text-slate-400">International</p>
      <p className="mt-4 max-w-md text-slate-400">
        Apply for admission, submit assignments, and manage courses — all in one place.
      </p>

      <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center rounded-2xl border border-gold/20 bg-ink-light p-6">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={56} height={56} className="rounded-full" />
          <h2 className="mt-3 font-semibold text-gold">Diploma Programs</h2>
          <p className="mt-1 text-sm text-slate-400">Revelation Bible College International</p>
          <Link
            href="/apply"
            className="mt-4 w-full rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
          >
            Apply Now
          </Link>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-gold/20 bg-ink-light p-6">
          <Image src="/tbcs-logo.png" alt="Tabernacle Bible College and Seminary" width={160} height={53} className="h-auto w-full max-w-[160px] rounded" />
          <h2 className="mt-3 font-semibold text-gold">Bachelor&apos;s, Master&apos;s &amp; Doctorate</h2>
          <p className="mt-1 text-sm text-slate-400">In partnership with Tabernacle Bible College and Seminary</p>
          <Link
            href="/apply/degree"
            className="mt-4 w-full rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
          >
            Apply Now
          </Link>
        </div>
      </div>

      <Link
        href="/login"
        className="mt-8 rounded-lg border border-gold/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-gold hover:bg-ink-light"
      >
        Sign In
      </Link>
    </div>
  );
}
