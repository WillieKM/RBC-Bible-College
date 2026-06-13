import { submitApplication } from "@/lib/actions/applications";
import Link from "next/link";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Apply for Admission</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill out the form below to submit your application.
        </p>

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
            Your application has been submitted! We&apos;ll be in touch by email.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!success && (
          <form action={submitApplication} className="mt-6 space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="program" className="block text-sm font-medium text-slate-700">
                Program
              </label>
              <input
                id="program"
                name="program"
                type="text"
                required
                placeholder="e.g. Bachelor of Theology"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="statement" className="block text-sm font-medium text-slate-700">
                Personal statement
              </label>
              <textarea
                id="statement"
                name="statement"
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Submit Application
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-blue-700 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
