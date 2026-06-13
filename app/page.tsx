import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center">
      <Image src="/logo.jpg" alt="Revelation Bible College International" width={140} height={140} className="rounded-full" />
      <h1 className="mt-6 text-3xl font-bold text-gold">Revelation Bible College</h1>
      <p className="mt-1 text-sm uppercase tracking-widest text-slate-400">International</p>
      <p className="mt-4 max-w-md text-slate-400">
        Apply for admission, submit assignments, and manage courses — all in one place.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/apply"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-dark"
        >
          Apply Now
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gold/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-gold hover:bg-ink-light"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
