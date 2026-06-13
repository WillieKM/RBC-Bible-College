import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Bible School Admin</h1>
      <p className="mt-2 max-w-md text-slate-500">
        Apply for admission, submit assignments, and manage courses — all in one place.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/apply"
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Apply Now
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
