import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { saveAttendance } from "@/lib/actions/professor";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfessorAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const profile = await requireRole(["professor"]);
  const { id } = await params;
  const { date: selectedDate } = await searchParams;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course || course.professor_id !== profile.id) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const sessionDate = selectedDate || today;

  const [{ data: enrollments }, { data: existingAttendance }, { data: allSessions }] = await Promise.all([
    supabase.from("enrollments").select("student_id, profiles(id, full_name, avatar_url, student_number)").eq("course_id", id),
    supabase.from("attendance").select("student_id, present").eq("course_id", id).eq("session_date", sessionDate),
    supabase.from("attendance").select("session_date").eq("course_id", id).order("session_date", { ascending: false }),
  ]);

  const attendanceMap = new Map(
    (existingAttendance ?? []).map((a) => [a.student_id, a.present])
  );

  const sessionDates = [...new Set((allSessions ?? []).map((a) => a.session_date))];

  const students = (enrollments ?? []).map((e) => {
    const p = e.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; student_number: string | null } | null;
    return p;
  }).filter(Boolean) as { id: string; full_name: string; avatar_url: string | null; student_number: string | null }[];

  return (
    <div className="max-w-2xl">
      <Link href={`/professor/courses/${id}`} className="text-sm text-gold-dark hover:underline">← Back to course</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Attendance — {course.title}</h1>

      {/* Date picker */}
      <form method="GET" className="mt-4 flex items-end gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Session Date</label>
          <input
            type="date"
            name="date"
            defaultValue={sessionDate}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <button type="submit" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Load
        </button>
      </form>

      {/* Attendance form */}
      <form action={saveAttendance} className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <input type="hidden" name="course_id" value={id} />
        <input type="hidden" name="session_date" value={sessionDate} />

        <div className="border-b border-slate-100 px-5 py-3">
          <p className="font-semibold text-slate-800">
            {new Date(sessionDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-slate-500">{students.length} student{students.length !== 1 ? "s" : ""} enrolled</p>
        </div>

        {students.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">No students enrolled yet.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {students.map((student) => {
              const isPresent = attendanceMap.has(student.id) ? attendanceMap.get(student.id) : true;
              return (
                <label key={student.id} className="flex cursor-pointer items-center gap-4 px-5 py-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name={`present_${student.id}`}
                    defaultChecked={isPresent}
                    className="h-4 w-4 rounded border-slate-300 accent-gold"
                  />
                  {student.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.avatar_url} alt={student.full_name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold">
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{student.full_name}</p>
                    {student.student_number && <p className="text-xs text-slate-400">{student.student_number}</p>}
                  </div>
                  <span className={`ml-auto text-xs font-semibold ${isPresent ? "text-green-600" : "text-red-500"}`}>
                    {attendanceMap.has(student.id) ? (isPresent ? "Present" : "Absent") : "Not marked"}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {students.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4">
            <DeleteButton
              label="Save Attendance"
              pendingLabel="Saving…"
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
            />
          </div>
        )}
      </form>

      {/* Past sessions */}
      {sessionDates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Past Sessions</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {sessionDates.map((d) => (
              <a
                key={d}
                href={`/professor/courses/${id}/attendance?date=${d}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${d === sessionDate ? "bg-gold text-ink" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
