import { submitApplication } from "@/lib/actions/applications";
import Link from "next/link";
import Image from "next/image";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={72} height={72} className="rounded-full" />
          <h1 className="mt-4 text-2xl font-bold text-gold">Apply for Admission</h1>
          <p className="mt-1 text-sm text-slate-400">
            Fill out the form below to submit your application to Revelation Bible College.
          </p>
        </div>

        {success && (
          <div className="mt-4 rounded-lg bg-green-950 border border-green-800 px-3 py-2 text-sm text-green-300">
            Your application has been submitted! We&apos;ll be in touch by email.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {!success && (
          <form action={submitApplication} className="mt-6 space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-300">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label htmlFor="program" className="block text-sm font-medium text-slate-300">
                Program
              </label>
              <select
                id="program"
                name="program"
                required
                defaultValue=""
                className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="" disabled>
                  Select a program
                </option>
                <optgroup label="Diploma Programs">
                  <option value="Diploma in Theology">Diploma in Theology</option>
                  <option value="Diploma in Biblical Studies">Diploma in Biblical Studies</option>
                  <option value="Diploma in Christian Ministry">Diploma in Christian Ministry</option>
                </optgroup>
                <optgroup label="Bachelor's Programs">
                  <option value="Bachelor of Theology (B.Th.)">Bachelor of Theology (B.Th.)</option>
                  <option value="Bachelor of Divinity (B.Div.)">Bachelor of Divinity (B.Div.)</option>
                  <option value="Bachelor of Religious Education (B.R.E.)">Bachelor of Religious Education (B.R.E.)</option>
                </optgroup>
                <optgroup label="Doctorate Programs">
                  <option value="Doctor of Theology (Th.D.)">Doctor of Theology (Th.D.)</option>
                  <option value="Doctor of Ministry (D.Min.)">Doctor of Ministry (D.Min.)</option>
                  <option value="Doctor of Divinity (D.D.)">Doctor of Divinity (D.D.)</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label htmlFor="statement" className="block text-sm font-medium text-slate-300">
                Personal statement
              </label>
              <textarea
                id="statement"
                name="statement"
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-ink px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              Submit Application
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/" className="text-gold hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
