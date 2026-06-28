import { createClient } from "@/lib/supabase/server";
import { assignProgramProfessor, createCourse, enrollProgramInModules, updateStudentProgram, updateProgramFee } from "@/lib/actions/admin";
import { PROGRAM_LEVEL_LABELS, feeForLevel, formatFee } from "@/lib/fees";
import type { Course, Profile, Program } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: program }, { data: modules }, { data: students }, { data: professors }, { data: allStudents }] = await Promise.all([
    supabase.from("programs").select("*").eq("id", id).single(),
    supabase.from("courses").select("*").eq("program_id", id).order("code", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "student").eq("program_id", id),
    supabase.from("profiles").select("*").eq("role", "professor"),
    supabase.from("profiles").select("*").eq("role", "student"),
  ]);

  if (!program) notFound();

  const professorMap = new Map((professors ?? []).map((p: Profile) => [p.id, p.full_name]));
  const unassignedStudents = (allStudents ?? []).filter((s: Profile) => s.program_id !== (program as Program).id);
  const totalCredits = (modules ?? []).reduce((sum: number, c: Course) => sum + (c.credits ?? 0), 0);

  return (
    <div>
      <p className="text-sm">
        <Link href="/admin/programs" className="text-gold-dark hover:underline">← Programs</Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{(program as Program).name}</h1>
      <p className="text-sm text-slate-500">{PROGRAM_LEVEL_LABELS[(program as Program).program_level]}</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-800">Program Lead</h2>
      <form action={assignProgramProfessor} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="id" value={(program as Program).id} />
        <div>
          <label className="block text-sm font-medium text-slate-700">Professor</label>
          <select name="professor_id" defaultValue={(program as Program).professor_id ?? ""} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {(professors ?? []).map((p: Profile) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          Save
        </button>
      </form>
      <p className="mt-2 text-sm text-slate-500">The assigned professor is emailed whenever a new application comes in for this program.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-800">Program Fees</h2>
      <p className="mt-1 text-sm text-slate-500">
        Set separate fees for international (Kenya/Africa) and USA students. The correct fee is automatically invoiced when a student is approved, based on the region they applied from.
        Leave blank to use the standard {PROGRAM_LEVEL_LABELS[(program as Program).program_level]} rate
        ({formatFee(feeForLevel((program as Program).program_level, "international"), "international")} / {formatFee(feeForLevel((program as Program).program_level, "usa"), "usa")}).
      </p>
      <form action={updateProgramFee} className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="id" value={(program as Program).id} />
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              International / Kenya fee
              <span className="ml-1 text-xs font-normal text-slate-400">(KSh — Kenyan Shilling)</span>
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">KSh</span>
              <input
                name="fee_international"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(program as Program).fee_international ?? ""}
                placeholder="e.g. 1500"
                className="w-44 rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              USA fee
              <span className="ml-1 text-xs font-normal text-slate-400">(USD $)</span>
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">$</span>
              <input
                name="fee_usa"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(program as Program).fee_usa ?? ""}
                placeholder="e.g. 500"
                className="w-44 rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-sm"
              />
            </div>
          </div>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">Save Fees</button>
        </div>
        {((program as Program).fee_international != null || (program as Program).fee_usa != null) && (
          <div className="mt-3 flex flex-wrap gap-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            {(program as Program).fee_international != null && (
              <span>International: <strong>KSh{Number((program as Program).fee_international).toLocaleString()}</strong></span>
            )}
            {(program as Program).fee_usa != null && (
              <span>USA: <strong>${Number((program as Program).fee_usa).toLocaleString()}</strong></span>
            )}
          </div>
        )}
      </form>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Modules</h2>
        {(modules ?? []).length > 0 && (students ?? []).length > 0 && (
          <form action={enrollProgramInModules}>
            <input type="hidden" name="program_id" value={(program as Program).id} />
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Enroll all students in all modules
            </button>
          </form>
        )}
      </div>
      <form action={createCourse} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="program_id" value={(program as Program).id} />
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input name="title" required placeholder="New Testament Survey" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Code</label>
          <input name="code" placeholder="NT101" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Credits</label>
          <input name="credits" type="number" step="1" min="0" placeholder="3" className="mt-1 w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
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
          Add Module
        </button>
      </form>

      <div className="mt-3 space-y-2">
        {(modules ?? []).map((course: Course) => (
          <Link
            key={course.id}
            href={`/admin/courses/${course.id}`}
            className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
          >
            <p className="font-semibold text-slate-900">
              {course.title} {course.code ? <span className="text-slate-400">({course.code})</span> : null}
              {course.credits ? <span className="ml-2 text-xs font-medium text-slate-400">{course.credits} credits</span> : null}
            </p>
            <p className="text-sm text-slate-500">
              {course.professor_id ? professorMap.get(course.professor_id) ?? "Unknown professor" : "Unassigned"}
            </p>
            {course.description && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{course.description}</p>}
          </Link>
        ))}
        {(modules ?? []).length === 0 && <p className="text-sm text-slate-500">No modules yet.</p>}
        {(modules ?? []).length > 0 && (
          <p className="text-right text-sm font-semibold text-slate-700">Total: {totalCredits} credits</p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-800">Students</h2>
      <div className="mt-3 space-y-2">
        {(students ?? []).map((student: Profile) => (
          <div key={student.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">{student.full_name}</p>
              <p className="text-sm text-slate-500">{student.email}</p>
            </div>
            <form action={updateStudentProgram}>
              <input type="hidden" name="id" value={student.id} />
              <input type="hidden" name="program_id" value="" />
              <button className="text-sm font-medium text-red-600 hover:underline">Remove from program</button>
            </form>
          </div>
        ))}
        {(students ?? []).length === 0 && <p className="text-sm text-slate-500">No students assigned to this program yet.</p>}
      </div>

      {unassignedStudents.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold text-slate-800">Add a student to this program</h2>
          <div className="mt-3 space-y-2">
            {unassignedStudents.map((student: Profile) => (
              <div key={student.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{student.full_name}</p>
                  <p className="text-sm text-slate-500">{student.email}</p>
                </div>
                <form action={updateStudentProgram}>
                  <input type="hidden" name="id" value={student.id} />
                  <input type="hidden" name="program_id" value={(program as Program).id} />
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Add
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
