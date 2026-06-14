import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { createAssignment } from "@/lib/actions/professor";
import type { Assignment } from "@/lib/types";
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

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .eq("course_id", id)
    .order("due_date", { ascending: true });

  return (
    <div>
      <Link href="/professor" className="text-sm text-gold-dark hover:underline">← Back to courses</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{course.title}</h1>
      <p className="text-slate-500">
        {course.code}
        {course.code && course.credits ? " · " : ""}
        {course.credits ? `${course.credits} credits` : ""}
      </p>
      {course.description && <p className="mt-2 text-sm text-slate-600">{course.description}</p>}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">New Assignment</h2>
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
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          Create Assignment
        </button>
      </form>

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Assignments</h2>
      <div className="mt-3 space-y-2">
        {(assignments ?? []).map((a: Assignment) => (
          <Link
            key={a.id}
            href={`/professor/assignments/${a.id}`}
            className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
          >
            <p className="font-semibold text-slate-900">{a.title}</p>
            <p className="text-sm text-slate-500">
              {a.due_date ? `Due ${a.due_date}` : "No due date"}
              {a.points_possible ? ` · ${a.points_possible} pts` : ""}
            </p>
          </Link>
        ))}
        {(assignments ?? []).length === 0 && <p className="text-sm text-slate-500">No assignments yet.</p>}
      </div>
    </div>
  );
}
