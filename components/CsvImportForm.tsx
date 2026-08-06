"use client";

import { useState, useRef } from "react";
import { bulkImportStudents } from "@/lib/actions/import";

const HEADERS = ["Full Name", "Email", "Program", "Region", "Student #"] as const;

const COL = [
  { th: "bg-blue-100 text-blue-700",      td: "bg-blue-50 text-blue-900" },
  { th: "bg-violet-100 text-violet-700",  td: "bg-violet-50 text-violet-900" },
  { th: "bg-amber-100 text-amber-700",    td: "bg-amber-50 text-amber-900" },
  { th: "bg-emerald-100 text-emerald-700",td: "bg-emerald-50 text-emerald-900" },
  { th: "bg-rose-100 text-rose-700",      td: "bg-rose-50 text-rose-900" },
] as const;

function parseLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  cols.push(cur.trim());
  return cols;
}

function validate(cols: string[], programs: string[]): string | null {
  const name    = cols[0]?.trim() ?? "";
  const email   = cols[1]?.trim() ?? "";
  const program = cols[2]?.trim() ?? "";
  if (!name)  return "Full Name required";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Valid email required";
  if (!program) return "Program required";
  if (programs.length > 0 && !programs.some(p => p.toLowerCase() === program.toLowerCase())) {
    return `Unknown: "${program}"`;
  }
  return null;
}

export function CsvImportForm({ programs }: { programs: string[] }) {
  const [csv, setCsv] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Live parse
  const lines     = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const dataLines = lines.filter(l => !/^(full.?name|name)/i.test(l.split(",")[0]));
  const rows      = dataLines.map(line => {
    const cols = parseLine(line);
    return { cols, error: validate(cols, programs) };
  });

  const validCount = rows.filter(r => !r.error).length;
  const errorCount = rows.filter(r => !!r.error).length;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCsv(String(ev.target?.result ?? ""));
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <form action={bulkImportStudents} encType="multipart/form-data" className="mt-6 space-y-5">

      {/* ── Input card ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Import</h2>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Paste CSV data
            <span className="ml-1 font-normal text-slate-400">(header row optional)</span>
          </label>
          <textarea
            name="csv_text"
            rows={8}
            value={csv}
            onChange={e => setCsv(e.target.value)}
            placeholder={
              "Full Name,Email,Program,Region,Student Number\n" +
              "John Mwangi,john@example.com,Diploma,international,\n" +
              "Jane Smith,jane@example.com,Certificate,international,RBC-2023-0012"
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700">Or upload a CSV file</label>
          <input
            type="file"
            name="csv_file"
            ref={fileRef}
            accept=".csv,text/csv"
            onChange={handleFile}
            className="mt-1 block text-sm text-slate-600"
          />
        </div>
      </div>

      {/* ── Rainbow preview ── */}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-800">Preview</h2>
            <div className="flex items-center gap-2">
              {validCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {validCount} ready
                </span>
              )}
              {errorCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="border-b border-slate-100 px-3 py-2 text-left text-slate-400 w-8">#</th>
                  {HEADERS.map((h, i) => (
                    <th key={h} className={`border-b border-slate-100 px-3 py-2 text-left font-semibold ${COL[i].th}`}>
                      {h}
                    </th>
                  ))}
                  <th className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={row.error ? "bg-red-50/70" : ""}>
                    <td className="border-t border-slate-100 px-3 py-2 text-slate-400">{ri + 1}</td>
                    {HEADERS.map((_, ci) => (
                      <td
                        key={ci}
                        className={`border-t border-slate-100 px-3 py-2 ${
                          row.error ? "text-red-700" : COL[ci].td
                        }`}
                      >
                        {row.cols[ci] ?? <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                    <td className="border-t border-slate-100 px-3 py-2 whitespace-nowrap">
                      {row.error
                        ? <span className="text-red-500">{row.error}</span>
                        : <span className="font-semibold text-emerald-600">✓ OK</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={validCount === 0}
          className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Import {validCount > 0 ? `${validCount} ` : ""}Student{validCount !== 1 ? "s" : ""}
        </button>

        {rows.length > 0 && validCount === 0 && (
          <p className="text-xs text-red-500">Fix errors above before importing.</p>
        )}
        {validCount > 0 && errorCount === 0 && (
          <p className="text-xs text-slate-400">Each student receives an invite email immediately.</p>
        )}
        {validCount > 0 && errorCount > 0 && (
          <p className="text-xs text-amber-600">
            {validCount} valid row{validCount !== 1 ? "s" : ""} will be imported; {errorCount} error{errorCount !== 1 ? "s" : ""} skipped.
          </p>
        )}
      </div>
    </form>
  );
}
