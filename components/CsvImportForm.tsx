"use client";

import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { bulkImportStudents } from "@/lib/actions/import";

// ── Column definitions ─────────────────────────────────────────────────────
const HEADERS = ["Full Name", "Email", "Program", "Region", "Student #"] as const;

const COL = [
  { th: "bg-blue-100 text-blue-700",         td: "bg-blue-50 text-blue-900",      dot: "bg-blue-400"    },
  { th: "bg-violet-100 text-violet-700",     td: "bg-violet-50 text-violet-900",  dot: "bg-violet-400"  },
  { th: "bg-amber-100 text-amber-700",       td: "bg-amber-50 text-amber-900",    dot: "bg-amber-400"   },
  { th: "bg-emerald-100 text-emerald-700",   td: "bg-emerald-50 text-emerald-900",dot: "bg-emerald-400" },
  { th: "bg-rose-100 text-rose-700",         td: "bg-rose-50 text-rose-900",      dot: "bg-rose-400"    },
] as const;

// ── CSV helpers ────────────────────────────────────────────────────────────
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
  if (programs.length > 0 && !programs.some(p => p.toLowerCase() === program.toLowerCase()))
    return `Unknown program: "${program}"`;
  return null;
}

// ── Submit button (needs useFormStatus so must be a child component) ────────
function SubmitButton({ validCount }: { validCount: number }) {
  const { pending } = useFormStatus();
  const disabled = validCount === 0 || pending;
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-ink shadow-sm transition-all hover:bg-gold-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? (
        <>
          <svg
            style={{ animation: "csvSpin 0.8s linear infinite" }}
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Importing…
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"/>
          </svg>
          Import {validCount > 0 ? `${validCount} ` : ""}Student{validCount !== 1 ? "s" : ""}
        </>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function CsvImportForm({ programs }: { programs: string[] }) {
  const [csv, setCsv]           = useState("");
  const [isDragging, setDrag]   = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live parse ───────────────────────────────────────────────────────────────
  const lines     = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const dataLines = lines.filter(l => !/^(full.?name|name)/i.test(l.split(",")[0]));
  const rows      = dataLines.map(line => ({ cols: parseLine(line), error: validate(parseLine(line), programs) }));
  const validCount = rows.filter(r => !r.error).length;
  const errorCount = rows.filter(r => !!r.error).length;
  const pct        = rows.length > 0 ? Math.round((validCount / rows.length) * 100) : 0;

  // File handling ────────────────────────────────────────────────────────────
  function loadFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setCsv(String(ev.target?.result ?? ""));
    reader.readAsText(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDrag(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  return (
    <form
      action={bulkImportStudents}
      encType="multipart/form-data"
      className="mt-6 space-y-5"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Step 1: Input ───────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border-2 bg-white p-5 shadow-sm transition-colors duration-200 ${
          isDragging
            ? "border-gold bg-amber-50/60 shadow-md"
            : "border-slate-200"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink">1</span>
          <h2 className="font-semibold text-slate-800">Paste or drop your CSV</h2>
          {fileName && (
            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              📄 {fileName}
            </span>
          )}
        </div>

        <textarea
          name="csv_text"
          rows={9}
          value={csv}
          onChange={e => { setCsv(e.target.value); setFileName(null); }}
          placeholder={
            "Full Name,Email,Program,Region,Student Number\n" +
            "John Mwangi,john@example.com,Diploma,international,\n" +
            "Jane Smith,jane@example.com,Certificate,international,RBC-2023-0012\n" +
            "Michael Lee,mike@example.com,Bachelor of Theology (B.Th.),usa,"
          }
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs leading-5 text-slate-800 placeholder:text-slate-400 focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 transition-colors"
        />

        {/* Drop zone / file picker */}
        <div
          className={`mt-3 flex items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-all duration-200 ${
            isDragging
              ? "border-gold bg-amber-50 text-gold-dark"
              : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500"
          }`}
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
          <span className="text-xs">
            {isDragging ? "Drop your CSV file here" : "Drag & drop a .csv file here, or"}
          </span>
          {!isDragging && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Browse…
            </button>
          )}
          <input
            type="file"
            name="csv_file"
            ref={fileRef}
            accept=".csv,text/csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {/* ── Step 2: Animated preview ─────────────────────────────────────── */}
      {rows.length > 0 && (
        <div
          style={{ animation: "csvFadeUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Header bar */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink">2</span>
            <h2 className="font-semibold text-slate-800">Review</h2>

            <div className="ml-auto flex items-center gap-2">
              {validCount > 0 && (
                <span
                  key={`v${validCount}`}
                  style={{ animation: "csvPop 0.3s ease-out" }}
                  className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700"
                >
                  {validCount} ready
                </span>
              )}
              {errorCount > 0 && (
                <span
                  key={`e${errorCount}`}
                  style={{ animation: "csvPop 0.3s ease-out" }}
                  className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600"
                >
                  {errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-100">
            <div
              className="h-full bg-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Column legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-5 py-2">
            {HEADERS.map((h, i) => (
              <span key={h} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${COL[i].dot}`} />
                {h}
              </span>
            ))}
          </div>

          {/* Rainbow table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="border-b border-slate-100 px-3 py-2 text-left text-slate-400">#</th>
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
                  <tr
                    key={ri}
                    style={{
                      animation: "csvRowIn 0.22s ease-out forwards",
                      animationDelay: `${ri * 28}ms`,
                      opacity: 0,
                    }}
                    className={row.error ? "bg-red-50/60" : "hover:bg-slate-50/60"}
                  >
                    <td className="border-t border-slate-100 px-3 py-2 text-slate-400">{ri + 1}</td>
                    {HEADERS.map((_, ci) => (
                      <td
                        key={ci}
                        className={`border-t border-slate-100 px-3 py-2 transition-colors ${
                          row.error ? "text-red-700" : COL[ci].td
                        }`}
                      >
                        {row.cols[ci] || <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                    <td className="border-t border-slate-100 px-3 py-2 whitespace-nowrap">
                      {row.error ? (
                        <span
                          style={{ animation: "csvShake 0.35s ease-out" }}
                          className="inline-block text-red-500"
                        >
                          ✗ {row.error}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600">✓ OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs text-slate-500">
            {rows.length} row{rows.length !== 1 ? "s" : ""} detected
            {validCount > 0 && errorCount === 0 && " — all valid, ready to import"}
            {validCount > 0 && errorCount > 0 && ` — ${validCount} will be imported, ${errorCount} will be skipped`}
            {validCount === 0 && " — fix errors before importing"}
          </div>
        </div>
      )}

      {/* ── Step 3: Submit ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <SubmitButton validCount={validCount} />
        {rows.length > 0 && (
          <p className={`text-xs transition-colors ${
            validCount === 0   ? "text-red-500"
            : errorCount > 0  ? "text-amber-600"
            : "text-slate-400"
          }`}>
            {validCount === 0
              ? "Fix all errors before importing."
              : errorCount > 0
              ? `${errorCount} error${errorCount !== 1 ? "s" : ""} will be skipped.`
              : "Each student receives an invite email immediately."}
          </p>
        )}
      </div>
    </form>
  );
}
