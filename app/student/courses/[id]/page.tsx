import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Assignment, CourseMaterial, Attendance } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["student"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*, courses(*)")
    .eq("course_id", id)
    .eq("student_id", profile.id)
    .single();
  if (!enrollment) notFound();

  const [{ data: assignments }, { data: submissions }, { data: materials }, { data: attendanceRows }] = await Promise.all([
    supabase.from("assignments").select("*").eq("course_id", id).order("due_date", { ascending: true }),
    supabase.from("submissions").select("*").eq("student_id", profile.id),
    supabase.from("course_materials").select("*").eq("course_id", id).order("created_at", { ascending: false }),
    supabase.from("attendance").select("*").eq("course_id", id).eq("student_id", profile.id).order("session_date", { ascending: false }),
  ]);

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));

  return (
    <div>
      <Link href="/student" className="text-sm text-gold-dark hover:underline">← Back to courses</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{enrollment.courses.title}</h1>
      <p className="text-slate-500">
        {enrollment.courses.code}
        {enrollment.courses.code && enrollment.courses.credits ? " · " : ""}
        {enrollment.courses.credits ? `${enrollment.courses.credits} credits` : ""}
      </p>
      {enrollment.courses.description && <p className="mt-2 text-sm text-slate-600">{enrollment.courses.description}</p>}

      {/* Course Materials */}
      {(materials ?? []).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-800">Course Materials</h2>
          <div className="mt-3 space-y-2">
            {(materials ?? []).map((m: CourseMaterial) => (
              <div key={m.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="font-medium text-slate-900">{m.title}</p>
                {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-gold-dark hover:underline">{m.url}</a>}
                {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="text-sm text-gold-dark hover:underline">Download →</a>}
                {m.body && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{m.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance */}
      {(attendanceRows ?? []).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-800">My Attendance</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {(attendanceRows ?? []).map((a: Attendance) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="px-4 py-2 text-slate-700">{a.session_date}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {a.present ? "Present" : "Absent"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Assignments</h2>
      <div className="mt-3 space-y-2">
        {(assignments ?? []).map((a: Assignment) => {
          const submission = submissionMap.get(a.id);
          return (
            <Link
              key={a.id}
              href={`/student/assignments/${a.id}`}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{a.title}</p>
                {submission ? (
                  submission.grade !== null ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Graded: {submission.grade}{a.points_possible ? ` / ${a.points_possible}` : ""}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Submitted</span>
                  )
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Not submitted</span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {a.due_date ? `Due ${a.due_date}` : "No due date"}
                {a.points_possible ? ` · ${a.points_possible} pts` : ""}
              </p>
            </Link>
          );
        })}
        {(assignments ?? []).length === 0 && <p className="text-sm text-slate-500">No assignments yet.</p>}
      </div>
    </div>
  );
}
