import { createClient } from "@/lib/supabase/server";
import { createProgram, deleteProgram } from "@/lib/actions/admin";
import { PROGRAM_LEVEL_LABELS } from "@/lib/fees";
import type { Profile, Program } from "@/lib/types";
import Link from "next/link";

export default async function AdminProgramsPage() {
  const supabase = await createClient();

  const [{ data: programs }, { data: students }, { data: courses }, { data: professors }] = await Promise.all([
    supabase.from("programs").select("*").order("name", { ascending: true }),
    supabase.from("profiles").select("id, program_id").eq("role", "student"),
    supabase.from("courses").select("id, program_id"),
    supabase.from("profiles").select("*").eq("role", "professor"),
  ]);

  const professorMap = new Map((professors ?? []).map((p: Profile) => [p.id, p.full_name]));

  const studentCounts = new Map<string, number>();
  for (const s of students ?? []) {
    if (!s.program_id) continue;
    studentCounts.set(s.program_id, (studentCounts.get(s.program_id) ?? 0) + 1);
  }

  const moduleCounts = new Map<string, number>();
  for (const c of courses ?? []) {
    if (!c.program_id) continue;
    moduleCounts.set(c.program_id, (moduleCounts.get(c.program_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Programs</h1>

      <form action={createProgram} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input name="name" required placeholder="Bachelor of Theology (B.Th.)" className="mt-1 w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Level</label>
          <select name="program_level" defaultValue="diploma" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="diploma">Diploma / Certificate</option>
            <option value="bachelors">Bachelor&apos;s</option>
            <option value="masters">Master&apos;s</option>
            <option value="doctorate">Doctorate</option>
          </select>
        </div>
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          Add Program
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(programs ?? []).map((program: Program) => (
          <div key={program.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div>
              <Link href={`/admin/programs/${program.id}`} className="font-semibold text-slate-900 hover:text-gold-dark">
                {program.name}
              </Link>
              <p className="text-sm text-slate-500">
                {PROGRAM_LEVEL_LABELS[program.program_level]}
                {" · "}
                {studentCounts.get(program.id) ?? 0} student{(studentCounts.get(program.id) ?? 0) === 1 ? "" : "s"}
                {" · "}
                {moduleCounts.get(program.id) ?? 0} module{(moduleCounts.get(program.id) ?? 0) === 1 ? "" : "s"}
                {" · "}
                {program.professor_id ? `Lead: ${professorMap.get(program.professor_id) ?? "Unknown"}` : "No professor assigned"}
              </p>
              {(program.fee_international != null || program.fee_usa != null) && (
                <p className="text-xs font-medium text-green-700">
                  {program.fee_international != null ? `Intl: KSh${Number(program.fee_international).toLocaleString()}` : ""}
                  {program.fee_international != null && program.fee_usa != null ? "  ·  " : ""}
                  {program.fee_usa != null ? `USA: $${Number(program.fee_usa).toLocaleString()}` : ""}
                </p>
              )}
            </div>
            <form action={deleteProgram}>
              <input type="hidden" name="id" value={program.id} />
              <button className="text-sm font-medium text-red-600 hover:underline">Delete</button>
            </form>
          </div>
        ))}
        {(programs ?? []).length === 0 && <p className="text-sm text-slate-500">No programs yet.</p>}
      </div>
    </div>
  );
}
