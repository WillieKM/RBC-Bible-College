import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Course } from "@/lib/types";
import Link from "next/link";

export default async function ProfessorHomePage() {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, cohorts(name)")
    .eq("professor_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
      <div className="mt-6 space-y-2">
        {(courses ?? []).map((course: Course & { cohorts?: { name: string } | null }) => (
          <Link
            key={course.id}
            href={`/professor/courses/${course.id}`}
            className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
          >
            <p className="font-semibold text-slate-900">
              {course.title} {course.code ? <span className="text-slate-400">({course.code})</span> : null}
            </p>
            <p className="text-sm text-slate-500">{course.cohorts?.name ?? "No cohort"}</p>
          </Link>
        ))}
        {(courses ?? []).length === 0 && <p className="text-sm text-slate-500">No courses assigned yet.</p>}
      </div>
    </div>
  );
}
