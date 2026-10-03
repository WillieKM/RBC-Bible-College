import { requireRole } from "@/lib/auth";
import { sendStudentInquiry } from "@/lib/actions/student";
import { DeleteButton } from "@/components/DeleteButton";

export default async function StudentContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const profile = await requireRole(["student"]);
  const { sent, error } = await searchParams;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">Contact Admin</h1>
      <p className="mt-1 text-sm text-slate-500">
        Send a message to the administration team. We&apos;ll reply to your email address on file.
      </p>

      {sent && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Message sent! We&apos;ll get back to you at <strong>{profile.email}</strong>.
        </div>
      )}

      {error === "missing" && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Please fill in both the subject and message.
        </div>
      )}

      <form action={sendStudentInquiry} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Your Name</label>
          <p className="mt-1 text-sm text-slate-800">{profile.full_name}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Reply-to Email</label>
          <p className="mt-1 text-sm text-slate-800">{profile.email}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
          <input
            name="subject"
            required
            placeholder="e.g. Question about my invoice"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Message</label>
          <textarea
            name="body"
            required
            rows={5}
            placeholder="Describe your question or concern…"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <DeleteButton
          label="Send Message"
          pendingLabel="Sending…"
          className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
        />
      </form>

      <p className="mt-4 text-xs text-slate-400">
        For urgent matters, reach us directly at{" "}
        <a href="mailto:admin@revelationbiblecollege.org" className="text-gold-dark hover:underline">
          admin@revelationbiblecollege.org
        </a>
      </p>
    </div>
  );
}
