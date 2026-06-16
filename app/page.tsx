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
        <div className="flex h-full flex-col items-center rounded-2xl border border-gold/20 bg-ink-light p-6 text-center">
          <div className="flex h-14 items-center justify-center">
            <Image src="/logo.jpg" alt="Revelation Bible College International" width={56} height={56} className="rounded-full" />
          </div>
          <h2 className="mt-3 font-semibold text-gold">Diploma Programs</h2>
          <p className="mt-1 text-sm text-slate-400">Revelation Bible College International</p>
          <div className="mt-auto grid w-full grid-cols-2 gap-2">
            <Link
              href="/apply?region=usa"
              className="rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              USA Campus
            </Link>
            <Link
              href="/apply?region=international"
              className="rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              Kenya / International
            </Link>
          </div>
        </div>

        <div className="flex h-full flex-col items-center rounded-2xl border border-gold/20 bg-ink-light p-6 text-center">
          <div className="flex h-14 items-center justify-center">
            <Image src="/tbcs-logo.png" alt="Tabernacle Bible College and Seminary" width={160} height={53} className="h-auto w-full max-w-[160px] rounded" />
          </div>
          <h2 className="mt-3 font-semibold text-gold">Bachelor&apos;s, Master&apos;s &amp; Doctorate</h2>
          <p className="mt-1 text-sm text-slate-400">In partnership with Tabernacle Bible College and Seminary</p>
          <div className="mt-auto grid w-full grid-cols-2 gap-2">
            <Link
              href="/apply/degree?region=usa"
              className="rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              USA Campus
            </Link>
            <Link
              href="/apply/degree?region=international"
              className="rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              Kenya / International
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/login?portal=student"
          className="rounded-lg border border-gold/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-gold hover:bg-ink-light"
        >
          Student Portal
        </Link>
        <Link
          href="/login?portal=professor"
          className="rounded-lg border border-gold/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-gold hover:bg-ink-light"
        >
          Professor Portal
        </Link>
        <Link
          href="/login?portal=admin"
          className="rounded-lg border border-gold/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-gold hover:bg-ink-light"
        >
          Admin Sign In
        </Link>
      </div>
    </div>
  );
}
