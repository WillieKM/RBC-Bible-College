import { createAdminClient } from "@/lib/supabase/admin";
import type { Cohort, Profile, Program } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminCohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: cohort }, { data: applications }, { data: programs }] = await Promise.all([
    admin.from("cohorts").select("*").eq("id", id).single(),
    admin.from("applications").select("*, profiles(id, full_name, email, student_number, program_id, payment_status, completed_at, region)").eq("cohort_id", id).eq("status", "approved"),
    admin.from("programs").select("id, name"),
  ]);

  if (!cohort) notFound();

  const c = cohort as Cohort;
  const programMap = new Map((programs ?? []).map((p: Pick<Program, "id" | "name">) => [p.id, p.name]));

  const students = (applications ?? []).map((a) => {
    return a.profiles as unknown as Profile | null;
  }).filter(Boolean) as Profile[];

  const total = students.length;
  const completed = students.filter((s) => s.completed_at).length;
  const paid = students.filter((s) => s.payment_status === "paid").length;
  const partial = students.filter((s) => s.payment_status === "partial").length;
  const unpaid = students.filter((s) => s.payment_status === "unpaid").length;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/cohorts" className="text-sm text-gold-dark hover:underline">← Cohorts</Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{c.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {c.start_date && c.end_date
              ? `${new Date(c.start_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })} – ${new Date(c.end_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
              : c.start_date ?? "Dates not set"}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Students", value: total, color: "text-slate-900" },
          { label: "Completed", value: completed, color: "text-green-700" },
          { label: "Fully Paid", value: paid, color: "text-green-700" },
          { label: "Unpaid", value: unpaid, color: unpaid > 0 ? "text-red-600" : "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment breakdown bar */}
      {total > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</p>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full">
            {paid > 0 && <div className="bg-green-500" style={{ width: `${(paid / total) * 100}%` }} />}
            {partial > 0 && <div className="bg-amber-400" style={{ width: `${(partial / total) * 100}%` }} />}
            {unpaid > 0 && <div className="bg-red-400" style={{ width: `${(unpaid / total) * 100}%` }} />}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" />{paid} paid</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />{partial} partial</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" />{unpaid} unpaid</span>
          </div>
        </div>
      )}

      {/* Student list */}
      <div className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Students ({total})
        </h2>
        {total === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No approved students in this cohort yet.</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {students.map((student) => {
              const programName = student.program_id ? programMap.get(student.program_id) ?? "—" : "—";
              const currency = student.region === "usa" ? "$" : "KSh";
              return (
                <Link
                  key={student.id}
                  href={`/admin/students/${student.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{student.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {student.student_number ? `${student.student_number} · ` : ""}{programName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {student.completed_at && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Graduated</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      student.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : student.payment_status === "partial"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {student.payment_status ?? "unpaid"}
                    </span>
                    <span className="text-xs text-slate-400">{currency}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
