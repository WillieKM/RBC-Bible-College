import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-4 py-16 text-center">

      {/* ── Ambient glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(212,175,55,0.10) 0%, transparent 70%)",
        }}
      />

      {/* ── Logo ── */}
      <div
        className="relative"
        style={{ animation: "hmFadeUp 0.5s ease-out both" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 48px 12px rgba(212,175,55,0.18)",
          }}
        />
        <Image
          src="/logo.jpg"
          alt="Revelation Bible College International"
          width={120}
          height={120}
          className="relative rounded-full ring-2 ring-gold/30"
          priority
        />
      </div>

      {/* ── Heading ── */}
      <div style={{ animation: "hmFadeUp 0.5s 0.08s ease-out both" }}>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-gold">
          Revelation Bible College
        </h1>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
          International
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
          Apply for admission, submit assignments, and manage courses — all in one place.
        </p>
        <p className="mt-2 text-xs italic text-slate-600">
          &ldquo;Study to show thyself approved unto God&rdquo; — 2 Tim 2:15
        </p>
      </div>

      {/* ── Program cards ── */}
      <div
        className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2"
        style={{ animation: "hmFadeUp 0.5s 0.16s ease-out both" }}
      >
        {/* Diploma card */}
        <div className="group flex h-full flex-col items-center rounded-2xl border border-gold/20 bg-ink-light p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_8px_32px_rgba(212,175,55,0.12)]">
          <div className="flex h-14 items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="Revelation Bible College International"
              width={52}
              height={52}
              className="rounded-full ring-1 ring-gold/30 transition-all group-hover:ring-gold/60"
            />
          </div>
          <h2 className="mt-3 font-bold text-gold">Diploma Programs</h2>
          <p className="mt-1 text-xs text-slate-500">Revelation Bible College International</p>
          <div className="mt-6 grid w-full grid-cols-2 gap-2">
            <Link
              href="/apply?region=usa"
              className="rounded-xl bg-gold px-3 py-2.5 text-sm font-bold text-ink shadow-sm transition-all hover:bg-gold-dark hover:shadow-md active:scale-95"
            >
              USA Campus
            </Link>
            <Link
              href="/apply?region=international"
              className="rounded-xl bg-gold px-3 py-2.5 text-sm font-bold text-ink shadow-sm transition-all hover:bg-gold-dark hover:shadow-md active:scale-95"
            >
              Kenya / Int&apos;l
            </Link>
          </div>
        </div>

        {/* Degree card */}
        <div className="group flex h-full flex-col items-center rounded-2xl border border-gold/20 bg-ink-light p-6 text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_8px_32px_rgba(212,175,55,0.12)]">
          <div className="flex h-14 items-center justify-center">
            <Image
              src="/tbcs-logo.png"
              alt="Tabernacle Bible College and Seminary"
              width={150}
              height={50}
              className="h-auto w-full max-w-[150px] rounded opacity-90 transition-opacity group-hover:opacity-100"
            />
          </div>
          <h2 className="mt-3 font-bold text-gold">
            Bachelor&apos;s, Master&apos;s &amp; Doctorate
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            In partnership with Tabernacle Bible College and Seminary
          </p>
          <div className="mt-6 grid w-full grid-cols-2 gap-2">
            <Link
              href="/apply/degree?region=usa"
              className="rounded-xl bg-gold px-3 py-2.5 text-sm font-bold text-ink shadow-sm transition-all hover:bg-gold-dark hover:shadow-md active:scale-95"
            >
              USA Campus
            </Link>
            <Link
              href="/apply/degree?region=international"
              className="rounded-xl bg-gold px-3 py-2.5 text-sm font-bold text-ink shadow-sm transition-all hover:bg-gold-dark hover:shadow-md active:scale-95"
            >
              Kenya / Int&apos;l
            </Link>
          </div>
        </div>
      </div>

      {/* ── Portal links ── */}
      <div
        className="mt-8 flex flex-wrap justify-center gap-3"
        style={{ animation: "hmFadeUp 0.5s 0.24s ease-out both" }}
      >
        <Link
          href="/student"
          className="group flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-white/8 hover:text-gold"
        >
          <svg className="h-4 w-4 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Student Portal
        </Link>
        <Link
          href="/professor"
          className="group flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-white/8 hover:text-gold"
        >
          <svg className="h-4 w-4 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Professor Portal
        </Link>
        <Link
          href="/admin"
          className="group flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-white/8 hover:text-gold"
        >
          <svg className="h-4 w-4 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Admin Sign In
        </Link>
      </div>

      {/* ── Footer ── */}
      <p
        className="mt-12 text-[11px] text-slate-700"
        style={{ animation: "hmFadeUp 0.5s 0.32s ease-out both" }}
      >
        © {new Date().getFullYear()} Revelation Bible College International
      </p>
    </div>
  );
}
