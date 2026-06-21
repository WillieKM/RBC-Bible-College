import { createClient } from "@/lib/supabase/server";
import { bulkImportStudents } from "@/lib/actions/import";
import type { Program } from "@/lib/types";

const TEMPLATE = [
  "Full Name,Email,Program,Region,Student Number",
  "John Mwangi,john@example.com,Diploma,international,",
  "Jane Smith,jane@example.com,Certificate,international,RBC-2023-0012",
  "Michael Lee,mike@example.com,Bachelor of Theology (B.Th.),usa,",
].join("\n");

export default async function BulkImportPage({
  searchParams,
}: {
  searchParams: Promise<{
    added?: string;
    skipped?: string;
    failed?: string;
    rows?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: programs } = await supabase.from("programs").select("name").order("name");

  const hasResults = params.added !== undefined || params.skipped !== undefined;

  let rowResults: { status: string; email: string; reason?: string }[] = [];
  if (params.rows) {
    try {
      rowResults = decodeURIComponent(params.rows)
        .split("~")
        .filter(Boolean)
        .map((r) => {
          const [status, email, reason] = r.split("|");
          return { status, email, reason };
        });
    } catch { /* ignore decode errors */ }
  }

  const programNames = (programs ?? []).map((p: Pick<Program, "name">) => p.name);

  return (
    <div className="max-w-2xl">
      <p className="text-sm">
        <a href="/admin/students" className="text-gold-dark hover:underline">← Students</a>
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Bulk Import Students</h1>
      <p className="mt-1 text-sm text-slate-500">
        For students already enrolled before this portal was set up. Each student receives an invitation email to set their password and access the portal.
      </p>

      {/* Results panel */}
      {hasResults && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Import Results</h2>
          <div className="mt-3 flex gap-4">
            <div className="rounded-lg bg-green-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-green-700">{params.added ?? 0}</p>
              <p className="text-xs text-green-600">Added</p>
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{params.skipped ?? 0}</p>
              <p className="text-xs text-amber-600">Skipped</p>
            </div>
            <div className="rounded-lg bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-700">{params.failed ?? 0}</p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
          </div>

          {rowResults.length > 0 && (
            <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {rowResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-700">{r.email}</span>
                  <div className="flex items-center gap-2">
                    {r.reason && <span className="text-xs text-slate-400">{r.reason}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.status === "added" ? "bg-green-100 text-green-700"
                      : r.status === "skipped" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                    }`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <a href="/admin/students/import" className="text-sm text-gold-dark hover:underline">Import another batch →</a>
          </div>
        </div>
      )}

      {params.error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {/* Instructions */}
      {!hasResults && (
        <>
          {/* Column format */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800">CSV Format</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left font-semibold text-slate-600">Column</th>
                    <th className="pb-2 text-left font-semibold text-slate-600">Required</th>
                    <th className="pb-2 text-left font-semibold text-slate-600">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  <tr><td className="py-1.5 pr-4 font-medium">Full Name</td><td className="pr-4 text-red-500">Yes</td><td>Student&apos;s full name</td></tr>
                  <tr><td className="py-1.5 pr-4 font-medium">Email</td><td className="pr-4 text-red-500">Yes</td><td>Login email — invitation sent here</td></tr>
                  <tr><td className="py-1.5 pr-4 font-medium">Program</td><td className="pr-4 text-red-500">Yes</td><td>Must exactly match a program name (see below)</td></tr>
                  <tr><td className="py-1.5 pr-4 font-medium">Region</td><td className="pr-4 text-slate-400">Optional</td><td><code>usa</code> or <code>international</code> (default: international)</td></tr>
                  <tr><td className="py-1.5 pr-4 font-medium">Student Number</td><td className="pr-4 text-slate-400">Optional</td><td>e.g. RBC-2023-0012 — auto-generated if blank</td></tr>
                </tbody>
              </table>
            </div>

            {programNames.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500">Valid program names:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {programNames.map((name) => (
                    <code key={name} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{name}</code>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Template download */}
          <div className="mt-3 flex items-center gap-3">
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
              download="student-import-template.csv"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Download template CSV
            </a>
          </div>
        </>
      )}

      {/* Import form */}
      {!hasResults && (
        <form action={bulkImportStudents} encType="multipart/form-data" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Import</h2>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Paste CSV data
              <span className="ml-1 font-normal text-slate-400">(include or skip the header row)</span>
            </label>
            <textarea
              name="csv_text"
              rows={10}
              placeholder={`Full Name,Email,Program,Region,Student Number\nJohn Mwangi,john@example.com,Diploma,international,\nJane Smith,jane@example.com,Certificate,international,RBC-2023-0012`}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Or upload a CSV file
            </label>
            <input
              type="file"
              name="csv_file"
              accept=".csv,text/csv"
              className="mt-1 block text-sm text-slate-600"
            />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              Import Students
            </button>
            <p className="text-xs text-slate-400">
              Each new student receives an email invitation to set their password.
              Existing accounts are skipped automatically.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
