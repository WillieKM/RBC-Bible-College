import { createClient } from "@/lib/supabase/server";
import { createCourse, deleteCourse } from "@/lib/actions/admin";
import type { Course, Profile, Program } from "@/lib/types";
import Link from "next/link";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const [{ data: courses }, { data: professors }, { data: programs }] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("role", "professor"),
    supabase.from("programs").select("*").order("name", { ascending: true }),
  ]);

  const professorMap = new Map((professors ?? []).map((p: Profile) => [p.id, p.full_name]));
  const programMap = new Map((programs ?? []).map((p: Program) => [p.id, p.name]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Courses</h1>

      <form action={createCourse} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input name="title" required placeholder="New Testament Survey" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Code</label>
          <input name="code" placeholder="NT101" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Program</label>
          <select name="program_id" defaultValue="" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">None</option>
            {(programs ?? []).map((p: Program) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Professor</label>
          <select name="professor_id" defaultValue="" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {(professors ?? []).map((p: Profile) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          Add Course
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(courses ?? []).map((course: Course) => (
          <div key={course.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div>
              <Link href={`/admin/courses/${course.id}`} className="font-semibold text-slate-900 hover:text-gold-dark">
                {course.title} {course.code ? <span className="text-slate-400">({course.code})</span> : null}
              </Link>
              <p className="text-sm text-slate-500">
                {course.professor_id ? professorMap.get(course.professor_id) ?? "Unknown professor" : "Unassigned"}
                {" · "}
                {course.program_id ? programMap.get(course.program_id) ?? "Unknown program" : "No program"}
              </p>
            </div>
            <form action={deleteCourse}>
              <input type="hidden" name="id" value={course.id} />
              <button className="text-sm font-medium text-red-600 hover:underline">Delete</button>
            </form>
          </div>
        ))}
        {(courses ?? []).length === 0 && <p className="text-sm text-slate-500">No courses yet.</p>}
      </div>
    </div>
  );
}
