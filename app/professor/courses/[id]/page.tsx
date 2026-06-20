import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { createAssignment, addCourseMaterial, deleteCourseMaterial, saveAttendance } from "@/lib/actions/professor";
import { DeleteButton } from "@/components/DeleteButton";
import type { Assignment, CourseMaterial } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfessorCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["professor"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course || course.professor_id !== profile.id) notFound();

  const [{ data: assignments }, { data: materials }, { data: enrollments }] = await Promise.all([
    supabase.from("assignments").select("*").eq("course_id", id).order("due_date", { ascending: true }),
    supabase.from("course_materials").select("*").eq("course_id", id).order("created_at", { ascending: false }),
    supabase.from("enrollments").select("*, profiles(full_name)").eq("course_id", id),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/professor" className="text-sm text-gold-dark hover:underline">← Back to courses</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{course.title}</h1>
        <p className="text-slate-500">
          {course.code}{course.code && course.credits ? " · " : ""}{course.credits ? `${course.credits} credits` : ""}
        </p>
        {course.description && <p className="mt-2 text-sm text-slate-600">{course.description}</p>}
      </div>

      {/* ── New Assignment ── */}
      <section>
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
      <section>
        <h2 className="text-lg font-semibold text-slate-800">Assignments</h2>
        <div className="mt-3 space-y-2">
          {(assignments ?? []).map((a: Assignment) => (
            <Link key={a.id} href={`/professor/assignments/${a.id}`} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold">
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-500">
                {a.due_date ? `Due ${a.due_date}` : "No due date"}{a.points_possible ? ` · ${a.points_possible} pts` : ""}
              </p>
            </Link>
          ))}
          {(assignments ?? []).length === 0 && <p className="text-sm text-slate-500">No assignments yet.</p>}
        </div>
      </section>

      {/* ── Course Materials ── */}
      <section>
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

      {/* ── Attendance ── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800">Mark Attendance</h2>
        {(enrollments ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No students enrolled yet.</p>
        ) : (
          <form action={saveAttendance} className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="course_id" value={course.id} />
            <div>
              <label className="block text-sm font-medium text-slate-700">Session date</label>
              <input name="session_date" type="date" defaultValue={today} required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 space-y-2">
              {(enrollments ?? []).map((e) => (
                <label key={e.student_id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                  <input type="checkbox" name={`present_${e.student_id}`} defaultChecked className="h-4 w-4 accent-gold" />
                  <span className="text-sm text-slate-800">{e.profiles?.full_name}</span>
                </label>
              ))}
            </div>
            <button className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Save Attendance</button>
          </form>
        )}
      </section>
    </div>
  );
}
