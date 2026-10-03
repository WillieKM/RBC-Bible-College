import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Course } from "@/lib/types";

export default async function AdminAttendancePage() {
  const supabase = createAdminClient();

  const [{ data: courses }, { data: programs }, { data: professors }] = await Promise.all([
    supabase.from("courses").select("id, title, code, program_id, professor_id").order("title"),
    supabase.from("programs").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").eq("role", "professor"),
  ]);

  const programMap = new Map((programs ?? []).map((p) => [p.id as string, p.name as string]));
  const professorMap = new Map((professors ?? []).map((p) => [p.id as string, p.full_name as string]));

  const byProgram = new Map<string, Course[]>();
  for (const c of (courses ?? []) as Course[]) {
    const key = c.program_id ?? "__none__";
    const list = byProgram.get(key) ?? [];
    list.push(c);
    byProgram.set(key, list);
  }

  const sorted = [...byProgram.entries()].sort(([a], [b]) => {
    if (a === "__none__") return 1;
    if (b === "__none__") return -1;
    return (programMap.get(a) ?? "").localeCompare(programMap.get(b) ?? "");
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">Select a course to mark or view attendance for any session date.</p>

      {sorted.length === 0 && <p className="mt-6 text-sm text-slate-400">No courses yet.</p>}

      {sorted.map(([programId, programCourses]) => (
        <div key={programId} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {programId === "__none__" ? "No program" : (programMap.get(programId) ?? "Unknown")}
          </h2>
          <div className="mt-2 space-y-2">
            {programCourses.map((c) => (
              <Link
                key={c.id}
                href={`/admin/attendance/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-gold hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {c.title}
                    {c.code && <span className="ml-1.5 text-xs font-normal text-slate-400">({c.code})</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {c.professor_id ? professorMap.get(c.professor_id) ?? "Unknown professor" : "No professor assigned"}
                  </p>
                </div>
                <span className="text-sm font-medium text-gold-dark">Mark Attendance →</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
