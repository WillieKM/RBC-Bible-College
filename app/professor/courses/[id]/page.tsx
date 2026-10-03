import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { createAssignment, addCourseMaterial, deleteCourseMaterial, sendProfessorMessage } from "@/lib/actions/professor";
import { postDiscussion, deleteDiscussion } from "@/lib/actions/discussions";
import { DeleteButton } from "@/components/DeleteButton";
import { AttendanceForm } from "@/components/AttendanceForm";
import { CourseSectionNav } from "@/components/CourseSectionNav";
import type { Assignment, CourseMaterial, Discussion } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfessorCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["professor"]);
  const { id } = await params;
  const admin = createAdminClient();

  // Use admin client to bypass RLS for professor reads
  const { data: course } = await admin.from("courses").select("*").eq("id", id).single();
  if (!course || course.professor_id !== profile.id) notFound();

  const [{ data: assignments }, { data: materials }, { data: enrollments }, { data: discussions }] = await Promise.all([
    admin.from("assignments").select("*").eq("course_id", id).order("due_date", { ascending: true }),
    admin.from("course_materials").select("*").eq("course_id", id).order("created_at", { ascending: false }),
    admin.from("enrollments").select("*, profiles(id, full_name, student_number)").eq("course_id", id),
    admin.from("course_discussions").select("*, profiles(full_name, role)").eq("course_id", id).is("parent_id", null).order("created_at", { ascending: true }),
  ]);

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: submissions } = assignmentIds.length > 0
    ? await admin.from("submissions").select("assignment_id, student_id, grade").in("assignment_id", assignmentIds)
    : { data: [] as { assignment_id: string; student_id: string; grade: number | null }[] };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/professor" className="text-sm text-gold-dark hover:underline">← Back to courses</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{course.title}</h1>
        <CourseSectionNav />
        <p className="text-slate-500">
          {course.code}{course.code && course.credits ? " · " : ""}{course.credits ? `${course.credits} credits` : ""}
        </p>
        {course.description && <p className="mt-2 text-sm text-slate-600">{course.description}</p>}
      </div>

      {/* ── New Assignment ── */}
      <section id="assignments">
        <h2 className="text-lg font-semibold text-slate-800">New Assignment</h2>
        <form action={createAssignment} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="course_id" value={course.id} />
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input name="title" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Due date</label>
            <input name="due_date" type="date" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Points</label>
            <input name="points_possible" type="number" min="0" className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea name="description" rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Create Assignment</button>
        </form>
      </section>

      {/* ── Assignments list ── */}
      <section id="assignments-list">
        <h2 className="text-lg font-semibold text-slate-800">Assignments</h2>
        <div className="mt-3 space-y-2">
          {(assignments ?? []).map((a: Assignment) => (
            <Link key={a.id} href={`/professor/assignments/${a.id}`} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold">
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-500">
                {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : "No due date"}{a.points_possible ? ` · ${a.points_possible} pts` : ""}
              </p>
            </Link>
          ))}
          {(assignments ?? []).length === 0 && <p className="text-sm text-slate-500">No assignments yet.</p>}
        </div>
      </section>

      {/* ── Course Materials ── */}
      <section id="materials">
        <h2 className="text-lg font-semibold text-slate-800">Course Materials</h2>
        <form action={addCourseMaterial} encType="multipart/form-data" className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="course_id" value={course.id} />
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-40">
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input name="title" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select name="type" defaultValue="link" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="link">Link</option>
                <option value="note">Note / Text</option>
                <option value="file">File upload</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">URL (for links)</label>
            <input name="url" type="url" placeholder="https://…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Note / description</label>
            <textarea name="body" rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">File upload</label>
            <input name="file" type="file" className="mt-1 block text-sm" />
          </div>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Add Material</button>
        </form>

        <div className="mt-3 space-y-2">
          {(materials ?? []).map((m: CourseMaterial) => (
            <div key={m.id} className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{m.title}</p>
                {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-gold-dark hover:underline">{m.url}</a>}
                {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" className="text-sm text-gold-dark hover:underline">Download file →</a>}
                {m.body && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{m.body}</p>}
              </div>
              <form action={deleteCourseMaterial}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <DeleteButton label="Remove" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
              </form>
            </div>
          ))}
          {(materials ?? []).length === 0 && <p className="text-sm text-slate-500">No materials posted yet.</p>}
        </div>
      </section>

      {/* ── Discussions ── */}
      <section id="discussion">
        <h2 className="text-lg font-semibold text-slate-800">Course Discussion</h2>
        <form action={postDiscussion} className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <input type="hidden" name="course_id" value={course.id} />
          <textarea name="body" rows={2} required placeholder="Post a message to students…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
          <div className="mt-2 flex justify-end">
            <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Post</button>
          </div>
        </form>
        <div className="mt-3 space-y-3">
          {(discussions ?? []).map((d) => {
            const disc = d as unknown as Discussion & { profiles?: { full_name: string; role: string } | null };
            const author = disc.profiles ?? null;
            return (
              <div key={disc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{author?.full_name ?? "Unknown"}</span>
                    {author?.role === "professor" && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold-dark">professor</span>}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{disc.body}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(disc.created_at).toLocaleString()}</p>
                  </div>
                  {(disc.author_id === profile.id) && (
                    <form action={deleteDiscussion}>
                      <input type="hidden" name="id" value={disc.id} />
                      <input type="hidden" name="course_id" value={course.id} />
                      <DeleteButton label="Delete" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
                    </form>
                  )}
                </div>
              </div>
            );
          })}
          {(discussions ?? []).length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
        </div>
      </section>

      {/* ── Enrolled Students ── */}
      <section id="students">
        <h2 className="text-lg font-semibold text-slate-800">Enrolled Students</h2>
        {(enrollments ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No students enrolled yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Student</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Submitted</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Graded</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Avg Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(enrollments ?? []).map((e) => {
                  const student = e.profiles as unknown as { id: string; full_name: string; student_number: string | null } | null;
                  if (!student) return null;
                  const studentSubs = (submissions ?? []).filter((s) => s.student_id === student.id);
                  const submitted = studentSubs.length;
                  const graded = studentSubs.filter((s) => s.grade != null);
                  const totalPts = graded.reduce((sum, s) => {
                    const asn = (assignments ?? []).find((a) => a.id === s.assignment_id);
                    return sum + (asn?.points_possible ?? 0);
                  }, 0);
                  const earnedPts = graded.reduce((sum, s) => sum + (s.grade ?? 0), 0);
                  const avgPct = totalPts > 0 ? Math.round((earnedPts / totalPts) * 100) : null;
                  return (
                    <tr key={e.student_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{student.full_name}</p>
                        {student.student_number && <p className="text-xs text-slate-400">{student.student_number}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{submitted} / {(assignments ?? []).length}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{graded.length} / {submitted}</td>
                      <td className="px-4 py-3 text-center">
                        {avgPct !== null ? (
                          <span className={`font-semibold ${avgPct >= 70 ? "text-green-700" : avgPct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                            {avgPct}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Message Students ── */}
      <section id="message">
        <h2 className="text-lg font-semibold text-slate-800">Message Students</h2>
        <form action={sendProfessorMessage} className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="course_id" value={course.id} />
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">To</label>
              <select name="student_id" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">All enrolled students</option>
                {(enrollments ?? []).map((e) => {
                  const s = e.profiles as unknown as { id: string; full_name: string } | null;
                  return <option key={e.student_id} value={e.student_id}>{s?.full_name}</option>;
                })}
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <input name="subject" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Message</label>
            <textarea name="body" rows={4} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
            Send Message
          </button>
        </form>
      </section>

      {/* ── Attendance ── */}
      <section id="attendance">
        <h2 className="text-lg font-semibold text-slate-800">Mark Attendance</h2>
        {(enrollments ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No students enrolled yet.</p>
        ) : (
          <AttendanceForm
            courseId={course.id}
            today={today}
            enrollments={(enrollments ?? []).map((e) => ({
              student_id: e.student_id,
              profiles: e.profiles as unknown as { full_name: string } | null,
            }))}
          />
        )}
      </section>
    </div>
  );
}
