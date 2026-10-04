import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { adminCreateAssignmentNotify } from "@/lib/actions/admin";
import { AdminAssignmentForm } from "@/components/AdminAssignmentForm";
import Link from "next/link";

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; }>;
}) {
  await requireRole(["admin"]);
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: assignments }, { data: submissionCounts }, { data: professors }, { data: courses }] = await Promise.all([
    supabase
      .from("assignments")
      .select("*, courses(title, code, profiles(full_name))")
      .order("due_date", { ascending: true }),
    supabase.from("submissions").select("assignment_id"),
    supabase.from("profiles").select("id, full_name").eq("role", "professor"),
    supabase.from("courses").select("id, title, code, program_id, programs(name)").order("title"),
  ]);

  const countMap = new Map<string, number>();
  for (const s of submissionCounts ?? []) {
    countMap.set(s.assignment_id, (countMap.get(s.assignment_id) ?? 0) + 1);
  }

  const professorMap = new Map((professors ?? []).map((p) => [p.id, p.full_name]));
  const now = new Date();

  type CourseOption = { id: string; title: string; code: string | null; programs: { name: string } | null };
  const courseOptions = (courses ?? []).map((c) => ({
    id: c.id,
    title: c.title as string,
    code: c.code as string | null,
    programName: (c.programs as unknown as { name: string } | null)?.name ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
      <p className="mt-1 text-sm text-slate-500">All assignments across every course. Create new ones here or via a course page.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Create assignment form */}
      <AdminAssignmentForm courses={courseOptions} action={adminCreateAssignmentNotify} />

      {/* Assignment table */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Assignment</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Course</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Professor</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Approval</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Due</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Points</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Submissions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(assignments ?? []).map((a) => {
              const course = a.courses as unknown as { title: string; code: string | null; profiles: { full_name: string } | null } | null;
              const dueDate = a.due_date ? new Date(a.due_date) : null;
              const overdue = dueDate && dueDate < now;
              const submissions = countMap.get(a.id) ?? 0;
              const approverName = a.approved_by ? professorMap.get(a.approved_by) : null;

              return (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{a.title}</p>
                    {a.description && (
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{a.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {course ? (
                      <Link href={`/admin/courses/${a.course_id}`} className="font-medium text-gold-dark hover:underline">
                        {course.title}
                        {course.code ? <span className="ml-1 text-slate-400 font-normal">({course.code})</span> : null}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {course?.profiles?.full_name ?? <span className="text-slate-300">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {approverName ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
                        ✓ {approverName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {dueDate ? (
                      <span className={overdue ? "font-medium text-red-600" : "text-slate-600"}>
                        {dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {overdue && <span className="ml-1 text-xs">(overdue)</span>}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {a.points_possible ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${submissions > 0 ? "text-green-700" : "text-slate-300"}`}>
                      {submissions}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/assignments/${a.id}`} className="text-xs text-gold-dark hover:underline">
                      Grade →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(assignments ?? []).length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No assignments yet.</p>
        )}
      </div>
    </div>
  );
}
