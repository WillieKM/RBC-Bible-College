import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import Link from "next/link";

function letterGrade(pct: number | null) {
  if (pct == null) return "—";
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

export default async function AdminProgressPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [
    { data: students },
    { data: enrollments },
    { data: assignments },
    { data: submissions },
    { data: attendance },
    { data: invoices },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, student_number").eq("role", "student").order("full_name"),
    supabase.from("enrollments").select("course_id, student_id"),
    supabase.from("assignments").select("id, course_id, points_possible"),
    supabase.from("submissions").select("assignment_id, student_id, grade"),
    supabase.from("attendance").select("student_id, present"),
    supabase.from("invoices").select("student_id, total_amount, paid_at"),
  ]);

  // per-student enrollments
  const enrollBySt = new Map<string, Set<string>>();
  for (const e of enrollments ?? []) {
    if (!enrollBySt.has(e.student_id)) enrollBySt.set(e.student_id, new Set());
    enrollBySt.get(e.student_id)!.add(e.course_id);
  }

  // assignments by course
  const asnByCourse = new Map<string, typeof assignments>();
  for (const a of assignments ?? []) {
    const list = asnByCourse.get(a.course_id) ?? [];
    list.push(a);
    asnByCourse.set(a.course_id, list);
  }

  // submissions by student
  const subBySt = new Map<string, Map<string, number | null>>();
  for (const s of submissions ?? []) {
    if (!subBySt.has(s.student_id)) subBySt.set(s.student_id, new Map());
    subBySt.get(s.student_id)!.set(s.assignment_id, s.grade);
  }

  // attendance by student
  const attBySt = new Map<string, { present: number; total: number }>();
  for (const a of attendance ?? []) {
    const cur = attBySt.get(a.student_id) ?? { present: 0, total: 0 };
    attBySt.set(a.student_id, { present: cur.present + (a.present ? 1 : 0), total: cur.total + 1 });
  }

  // invoices by student
  const finBySt = new Map<string, number>();
  for (const inv of invoices ?? []) {
    if (!inv.paid_at) finBySt.set(inv.student_id, (finBySt.get(inv.student_id) ?? 0) + (inv.total_amount ?? 0));
  }

  function gradeMetrics(studentId: string) {
    const courseIds = [...(enrollBySt.get(studentId) ?? new Set())];
    const allAsn = courseIds.flatMap((cid) => asnByCourse.get(cid) ?? []);
    const subMap = subBySt.get(studentId) ?? new Map();
    const graded = allAsn.filter((a) => subMap.get(a.id) != null);
    const possible = graded.reduce((sum, a) => sum + (a.points_possible ?? 0), 0);
    const earned = graded.reduce((sum, a) => sum + (subMap.get(a.id) ?? 0), 0);
    const pct = possible > 0 ? Math.round((earned / possible) * 100) : null;
    return { pct, graded: graded.length, total: allAsn.length };
  }

  const list = (students ?? []) as Profile[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Student Progress</h1>
      <p className="mt-1 text-sm text-slate-500">
        Grade average, attendance rate, and outstanding balance for every student.
      </p>

      {list.length === 0 && <p className="mt-6 text-sm text-slate-500">No students yet.</p>}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Student</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Grade Avg</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Attendance</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Outstanding</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((student) => {
              const { pct, graded, total } = gradeMetrics(student.id);
              const att = attBySt.get(student.id);
              const attPct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
              const owed = finBySt.get(student.id) ?? 0;

              return (
                <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{student.full_name}</p>
                    <p className="text-xs text-slate-400">{student.email}</p>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {pct != null ? (
                      <>
                        <span className={`font-semibold ${pct >= 70 ? "text-green-700" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {pct}% {letterGrade(pct)}
                        </span>
                        <p className="text-xs text-slate-400">{graded}/{total} graded</p>
                      </>
                    ) : (
                      <span className="text-slate-400">No grades</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {attPct != null ? (
                      <>
                        <span className={`font-semibold ${attPct >= 80 ? "text-green-700" : attPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                          {attPct}%
                        </span>
                        <p className="text-xs text-slate-400">{att!.present}/{att!.total} sessions</p>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {owed > 0 ? (
                      <span className="font-semibold text-red-600">{owed.toLocaleString()}</span>
                    ) : (
                      <span className="font-semibold text-green-600">Clear</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/students/${student.id}`} className="text-xs text-gold-dark hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
