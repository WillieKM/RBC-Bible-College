import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

export default async function AdminAssignmentsPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, courses(title, code, profiles(full_name))")
    .order("due_date", { ascending: true });

  const { data: submissionCounts } = await supabase
    .from("submissions")
    .select("assignment_id");

  const countMap = new Map<string, number>();
  for (const s of submissionCounts ?? []) {
    countMap.set(s.assignment_id, (countMap.get(s.assignment_id) ?? 0) + 1);
  }

  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
      <p className="mt-1 text-sm text-slate-500">All assignments across every course, including those created by professors.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Assignment</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Course</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Professor</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Due</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Points</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Submissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(assignments ?? []).map((a) => {
              const course = a.courses as unknown as { title: string; code: string | null; profiles: { full_name: string } | null } | null;
              const dueDate = a.due_date ? new Date(a.due_date) : null;
              const overdue = dueDate && dueDate < now;
              const submissions = countMap.get(a.id) ?? 0;

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
                      <Link
                        href={`/admin/courses/${a.course_id}`}
                        className="font-medium text-gold-dark hover:underline"
                      >
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
                </tr>
              );
            })}
          </tbody>
        </table>
        {(assignments ?? []).length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No assignments yet. Professors create them from their course pages.</p>
        )}
      </div>
    </div>
  );
}
