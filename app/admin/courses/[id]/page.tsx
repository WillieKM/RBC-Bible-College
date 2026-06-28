import { createClient } from "@/lib/supabase/server";
import { enrollStudent, unenrollStudent, updateCourse } from "@/lib/actions/admin";
import type { Course, Profile, Program } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) notFound();

  const [{ data: enrollments }, { data: students }, { data: programs }, { data: professors }, { data: otherModules }] = await Promise.all([
    supabase.from("enrollments").select("*, profiles(*)").eq("course_id", id),
    supabase.from("profiles").select("*").eq("role", "student"),
    supabase.from("programs").select("*").order("name", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "professor"),
    supabase.from("courses").select("*").neq("id", id).order("code", { ascending: true }),
  ]);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const availableStudents = (students ?? []).filter((s: Profile) => !enrolledIds.has(s.id));

  return (
    <div>
      <Link href="/admin/courses" className="text-sm text-gold-dark hover:underline">← Back to courses</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{course.title}</h1>
      <p className="text-slate-500">
        {course.code}
        {course.code && course.credits ? " · " : ""}
        {course.credits ? `${course.credits} credits` : ""}
      </p>
      {course.description && <p className="mt-2 text-sm text-slate-600">{course.description}</p>}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Edit Module</h2>
      <form action={updateCourse} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="id" value={course.id} />
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input name="title" required defaultValue={course.title} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Code</label>
          <input name="code" defaultValue={course.code ?? ""} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Credits</label>
          <input name="credits" type="number" step="1" min="0" defaultValue={course.credits ?? ""} className="mt-1 w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea name="description" rows={2} defaultValue={course.description ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Program</label>
          <select name="program_id" defaultValue={course.program_id ?? ""} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">None</option>
            {(programs ?? []).map((p: Program) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Professor</label>
          <select name="professor_id" defaultValue={course.professor_id ?? ""} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {(professors ?? []).map((p: Profile) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Prerequisite</label>
          <select name="prerequisite_id" defaultValue={course.prerequisite_id ?? ""} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">None</option>
            {(otherModules ?? []).map((m: Course) => (
              <option key={m.id} value={m.id}>{m.title} {m.code ? `(${m.code})` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Send notification after (days)</label>
          <input
            name="release_days"
            type="number"
            min="0"
            defaultValue={course.release_days ?? ""}
            placeholder="e.g. 7"
            className="mt-1 w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">Days after enrollment to email students about this module. Leave blank to disable.</p>
        </div>
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          Save
        </button>
      </form>

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Enrolled Students</h2>
      <div className="mt-3 space-y-2">
        {(enrollments ?? []).map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
            <span className="font-medium text-slate-800">{e.profiles?.full_name}</span>
            <span className="text-slate-500">{e.profiles?.email}</span>
            <form action={unenrollStudent}>
              <input type="hidden" name="course_id" value={course.id} />
              <input type="hidden" name="enrollment_id" value={e.id} />
              <button className="text-sm font-medium text-red-600 hover:underline">Remove</button>
            </form>
          </div>
        ))}
        {(enrollments ?? []).length === 0 && <p className="text-sm text-slate-500">No students enrolled.</p>}
      </div>

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Enroll a Student</h2>
      <form action={enrollStudent} className="mt-3 flex items-end gap-3">
        <input type="hidden" name="course_id" value={course.id} />
        <select name="student_id" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select a student</option>
          {availableStudents.map((s: Profile) => (
            <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
          ))}
        </select>
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          Enroll
        </button>
      </form>
    </div>
  );
}
