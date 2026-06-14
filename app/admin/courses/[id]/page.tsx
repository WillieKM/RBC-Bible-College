import { createClient } from "@/lib/supabase/server";
import { enrollStudent, unenrollStudent } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";
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

  const [{ data: enrollments }, { data: students }] = await Promise.all([
    supabase.from("enrollments").select("*, profiles(*)").eq("course_id", id),
    supabase.from("profiles").select("*").eq("role", "student"),
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
