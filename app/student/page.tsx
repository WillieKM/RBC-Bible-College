import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Announcement, Assignment, Course } from "@/lib/types";
import Link from "next/link";

// Payment details — set matching env vars in Vercel to override
const ZELLE_CASHAPP = process.env.PAYMENT_ZELLE_CASHAPP || "253-275-8494";
const MPESA_PAYBILL = process.env.MPESA_PAYBILL         || "542542";
const MPESA_ACCOUNT = process.env.MPESA_ACCOUNT         || "03009422856350";

export default async function StudentHomePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const [{ data: enrollments }, { data: program }, { data: programCourses }, { data: announcements }, { data: invoices }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, courses(*)")
      .eq("student_id", profile.id),
    profile.program_id
      ? supabase.from("programs").select("*").eq("id", profile.program_id).single()
      : Promise.resolve({ data: null }),
    profile.program_id
      ? supabase.from("courses").select("*").eq("program_id", profile.program_id)
      : Promise.resolve({ data: [] as Course[] }),
    supabase.from("announcements").select("*").in("target", ["all", "students"]).order("created_at", { ascending: false }).limit(5),
    supabase.from("invoices").select("invoice_number, title, total_amount, paid_at, currency").eq("student_id", profile.id).order("created_at", { ascending: false }),
  ]);

  const courseIds = (enrollments ?? []).map((e) => e.courses.id);

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    courseIds.length > 0
      ? supabase.from("assignments").select("*").in("course_id", courseIds)
      : Promise.resolve({ data: [] as Assignment[] }),
    supabase.from("submissions").select("*").eq("student_id", profile.id),
  ]);

  const submissionMap = new Map((submissions ?? []).map((s) => [s.assignment_id, s]));
  const assignmentsByCourse = new Map<string, Assignment[]>();
  for (const a of assignments ?? []) {
    const list = assignmentsByCourse.get(a.course_id) ?? [];
    list.push(a);
    assignmentsByCourse.set(a.course_id, list);
  }

  const completedCourseIds = new Set(
    courseIds.filter((id) => {
      const courseAssignments = assignmentsByCourse.get(id) ?? [];
      return courseAssignments.length > 0 && courseAssignments.every((a) => submissionMap.get(a.id)?.grade != null);
    })
  );

  const courseTitleMap = new Map((programCourses ?? []).map((c: Course) => [c.id, `${c.title}${c.code ? ` (${c.code})` : ""}`]));
  const totalCredits = (programCourses ?? []).reduce((sum: number, c: Course) => sum + (c.credits ?? 0), 0);
  const completedCredits = (programCourses ?? [])
    .filter((c: Course) => completedCourseIds.has(c.id))
    .reduce((sum: number, c: Course) => sum + (c.credits ?? 0), 0);
  const remainingModules = (programCourses ?? []).filter((c: Course) => !completedCourseIds.has(c.id));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (assignments ?? [])
    .filter((a) => a.due_date && a.due_date >= today && submissionMap.get(a.id)?.grade == null)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Modules</h1>
      <p className="text-sm text-slate-500">{program ? program.name : "No program assigned yet"}</p>
      {profile.student_number && (
        <p className="text-sm text-slate-500">Student ID: {profile.student_number}</p>
      )}

      {/* Fees & Payment */}
      {(invoices ?? []).length > 0 && (() => {
        const region: string = (profile as unknown as { region?: string }).region ?? "international";
        const isUsa = region === "usa";
        const unpaid = (invoices ?? []).filter((inv: { paid_at: string | null }) => !inv.paid_at);
        const paid   = (invoices ?? []).filter((inv: { paid_at: string | null }) =>  inv.paid_at);
        return (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Fees &amp; Payment</h2>

            {/* Invoice list */}
            <div className="mt-3 space-y-2">
              {(invoices ?? []).map((inv: { invoice_number: string; title: string; total_amount: number; paid_at: string | null; currency?: string }) => {
                const symbol = isUsa ? "$" : "KSh ";
                return (
                  <div key={inv.invoice_number} className="flex items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{inv.title}</p>
                      <p className="text-slate-500">{inv.invoice_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{symbol}{inv.total_amount?.toLocaleString()}</p>
                      {inv.paid_at
                        ? <p className="text-xs text-green-600 font-semibold">Paid</p>
                        : <p className="text-xs text-amber-600 font-semibold">Outstanding</p>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment instructions — only show when there are unpaid invoices */}
            {unpaid.length > 0 && (
              <div className="mt-4 border-t border-amber-200 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">How to pay:</p>
                {isUsa ? (
                  <div className="rounded-lg border border-amber-100 bg-white px-4 py-3 text-sm space-y-1">
                    <p className="font-semibold text-slate-800">Zelle or Cash App</p>
                    <p className="text-slate-600">Send to: <span className="font-mono font-semibold text-slate-800">{ZELLE_CASHAPP}</span></p>
                    <p className="text-slate-500 text-xs">Include your name and student ID in the memo/note.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-100 bg-white px-4 py-3 text-sm space-y-2">
                    <p className="font-semibold text-slate-800">M-Pesa — Lipa na M-Pesa → Pay Bill</p>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-32">Paybill Number:</span>
                      <span className="font-mono font-bold text-lg text-slate-900">{MPESA_PAYBILL}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 w-32">Account Number:</span>
                      <span className="font-mono font-bold text-lg text-slate-900">{MPESA_ACCOUNT}</span>
                    </div>
                    <p className="text-slate-500 text-xs pt-1">Use your name and student ID as your payment reference note.</p>
                  </div>
                )}
              </div>
            )}

            {paid.length > 0 && unpaid.length === 0 && (
              <p className="mt-3 text-sm text-green-700 font-medium">All fees paid — thank you!</p>
            )}
          </div>
        );
      })()}

      {profile.program_id && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Degree Progress</h2>
          <p className="mt-1 text-sm text-slate-600">
            {completedCredits} of {totalCredits} credits completed
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${totalCredits > 0 ? Math.min(100, (completedCredits / totalCredits) * 100) : 0}%` }}
            />
          </div>
          {remainingModules.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Remaining: {remainingModules.map((c: Course) => c.title).join(", ")}
            </p>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Upcoming Due Dates</h2>
          <div className="mt-3 space-y-2">
            {upcoming.map((a) => {
              const course = (enrollments ?? []).find((e) => e.courses.id === a.course_id)?.courses;
              return (
                <Link
                  key={a.id}
                  href={`/student/assignments/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:border-gold"
                >
                  <span className="font-medium text-slate-800">
                    {a.title} <span className="text-slate-400">— {course?.title}</span>
                  </span>
                  <span className="text-slate-500">Due {a.due_date}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Announcements */}
      {(announcements ?? []).length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Announcements</h2>
          <div className="mt-3 space-y-3">
            {(announcements ?? []).map((a: Announcement) => (
              <div key={a.id} className="border-l-4 border-gold pl-3">
                <p className="font-medium text-slate-900">{a.title}</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.body}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Modules</h2>
      <div className="mt-3 space-y-2">
        {(enrollments ?? []).map((e) => {
          const course = e.courses as Course;
          const prerequisiteTitle = course.prerequisite_id ? courseTitleMap.get(course.prerequisite_id) : null;
          const locked = !!course.prerequisite_id && !completedCourseIds.has(course.prerequisite_id);
          return (
            <Link
              key={e.id}
              href={`/student/courses/${course.id}`}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">
                  {course.title} {course.code ? <span className="text-slate-400">({course.code})</span> : null}
                </p>
                {completedCourseIds.has(course.id) && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Completed</span>
                )}
                {locked && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    Locked — complete {prerequisiteTitle} first
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {(enrollments ?? []).length === 0 && <p className="text-sm text-slate-500">You're not enrolled in any courses yet.</p>}
      </div>
    </div>
  );
}
