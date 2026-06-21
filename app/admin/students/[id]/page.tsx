import { createAdminClient } from "@/lib/supabase/admin";
import { updateStudentProfile, updatePaymentStatus, markProgramComplete } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";
import type { Assignment, Course, Invoice, Payment, Program, Submission } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [
    { data: student },
    { data: programs },
    { data: enrollments },
    { data: invoicesRaw },
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).single(),
    admin.from("programs").select("id, name, fee_international, fee_usa"),
    admin.from("enrollments").select("*, courses(id, title, code, credits, program_id)").eq("student_id", id),
    admin.from("invoices").select("*, payments(amount)").eq("student_id", id).order("created_at", { ascending: false }),
  ]);

  if (!student) notFound();

  const programMap = new Map((programs ?? []).map((p: Pick<Program, "id" | "name">) => [p.id, p]));
  const studentProgram = student.program_id ? programMap.get(student.program_id) ?? null : null;
  const currency = student.region === "usa" ? "$" : "KSh";

  const courseIds = (enrollments ?? []).map((e) => (e.courses as unknown as Course)?.id).filter(Boolean);

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    courseIds.length > 0
      ? admin.from("assignments").select("*").in("course_id", courseIds)
      : Promise.resolve({ data: [] as Assignment[] }),
    admin.from("submissions").select("*").eq("student_id", id),
  ]);

  const submissionMap = new Map(((submissions ?? []) as Submission[]).map((s) => [s.assignment_id, s]));

  const invoices = ((invoicesRaw ?? []) as (Invoice & { payments: { amount: number }[] })[]).map((inv) => {
    const paid = (inv.payments ?? []).reduce((s, p) => s + p.amount, 0);
    return { ...inv, paid, balance: inv.total_amount - paid };
  });
  const totalBilled = invoices.reduce((s, i) => s + i.total_amount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const totalBalance = totalBilled - totalPaid;

  // Course progress
  const courseData = (enrollments ?? []).map((e) => {
    const course = e.courses as unknown as Course;
    if (!course) return null;
    const courseAssignments = ((assignments ?? []) as Assignment[]).filter((a) => a.course_id === course.id);
    const graded = courseAssignments.filter((a) => submissionMap.get(a.id)?.grade != null);
    const totalPts = graded.reduce((s, a) => s + (a.points_possible ?? 0), 0);
    const earnedPts = graded.reduce((s, a) => {
      const sub = submissionMap.get(a.id);
      return s + (sub?.grade ?? 0);
    }, 0);
    const pct = totalPts > 0 ? Math.round((earnedPts / totalPts) * 100) : null;
    return { course, courseAssignments, graded: graded.length, totalPts, earnedPts, pct };
  }).filter(Boolean) as { course: Course; courseAssignments: Assignment[]; graded: number; totalPts: number; earnedPts: number; pct: number | null }[];

  function letterGrade(pct: number | null) {
    if (pct === null) return "—";
    if (pct >= 90) return "A";
    if (pct >= 80) return "B";
    if (pct >= 70) return "C";
    if (pct >= 60) return "D";
    return "F";
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/students" className="text-sm text-gold-dark hover:underline">← Students</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{student.full_name}</h1>
        <p className="text-sm text-slate-500">{student.email}</p>
      </div>

      {/* Edit profile */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800">Profile</h2>
        <form action={updateStudentProfile} className="mt-4 grid grid-cols-2 gap-4">
          <input type="hidden" name="id" value={student.id} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
            <input
              name="full_name"
              required
              defaultValue={student.full_name}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Student ID</label>
            <input
              name="student_number"
              defaultValue={student.student_number ?? ""}
              placeholder="e.g. RBC-2026-0001"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Program</label>
            <select
              name="program_id"
              defaultValue={student.program_id ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">No program</option>
              {(programs ?? []).map((p: Pick<Program, "id" | "name">) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Region</label>
            <select
              name="region"
              defaultValue={student.region ?? "international"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="international">International (KSh)</option>
              <option value="usa">USA ($)</option>
            </select>
          </div>

          <div className="col-span-2 flex items-center gap-3">
            <DeleteButton
              label="Save Changes"
              pendingLabel="Saving…"
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
            />
            <p className="text-xs text-slate-400">
              Changing program will auto-enroll the student in all new program modules.
            </p>
          </div>
        </form>
      </div>

      {/* Status controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</h2>
          <form action={updatePaymentStatus} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="id" value={student.id} />
            <select
              name="payment_status"
              defaultValue={student.payment_status ?? "unpaid"}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                student.payment_status === "paid"
                  ? "border-green-300 bg-green-50 text-green-700"
                  : student.payment_status === "partial"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <DeleteButton label="Save" pendingLabel="…" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50" />
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Program Completion</h2>
          <form action={markProgramComplete} className="mt-3">
            <input type="hidden" name="id" value={student.id} />
            {student.completed_at ? (
              <>
                <p className="text-sm font-semibold text-green-700">
                  ✓ Completed {new Date(student.completed_at).toLocaleDateString()}
                </p>
                <input type="hidden" name="undo" value="1" />
                <DeleteButton label="Undo Completion" pendingLabel="…" className="mt-2 text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
              </>
            ) : (
              <DeleteButton label="Mark as Complete" pendingLabel="Marking…" className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50" />
            )}
          </form>
        </div>
      </div>

      {/* Financial summary */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-800">Invoices</h2>
          <Link href="/admin/invoices" className="text-xs text-gold-dark hover:underline">Manage all →</Link>
        </div>

        {invoices.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">No invoices yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-px bg-slate-100">
              {[
                { label: "Total Billed", value: `${currency}${totalBilled.toFixed(2)}`, color: "text-slate-900" },
                { label: "Total Paid", value: `${currency}${totalPaid.toFixed(2)}`, color: "text-green-700" },
                { label: "Balance", value: `${currency}${Math.max(0, totalBalance).toFixed(2)}`, color: totalBalance > 0 ? "text-red-600" : "text-green-700" },
              ].map((s) => (
                <div key={s.label} className="bg-white px-4 py-3 text-center">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-50">
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.title}</p>
                    <p className="text-xs text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{currency}{inv.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Bal: {currency}{Math.max(0, inv.balance).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Course progress */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-800">
            Course Enrolment
            {studentProgram ? <span className="ml-2 text-sm font-normal text-slate-500">— {studentProgram.name}</span> : null}
          </h2>
        </div>
        {courseData.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">Not enrolled in any courses.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {courseData.map(({ course, courseAssignments, graded, totalPts, earnedPts, pct }) => (
              <div key={course.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{course.title}</p>
                  <p className="text-xs text-slate-400">
                    {graded}/{courseAssignments.length} assignments graded
                    {course.credits ? ` · ${course.credits} credits` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{letterGrade(pct)}</p>
                  {pct !== null && (
                    <p className="text-xs text-slate-500">{pct}% · {earnedPts}/{totalPts} pts</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
