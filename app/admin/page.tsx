import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApplyLinks } from "@/components/ApplyLinks";
import Link from "next/link";

export default async function AdminHomePage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [
    { count: pendingCount },
    { count: programCount },
    { count: courseCount },
    { count: studentCount },
    { count: professorCount },
    { data: recentSubmissions },
    { data: recentGrades },
    { data: recentAssignments },
    { data: recentApplications },
    { data: invoiceRows },
    { data: paymentRows },
    { count: completedCount },
  ] = await Promise.all([
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "professor"),

    supabase
      .from("submissions")
      .select("id, submitted_at, student_id, assignment_id, grade, profiles(full_name), assignments(title, courses(title))")
      .order("submitted_at", { ascending: false })
      .limit(8),

    supabase
      .from("submissions")
      .select("id, graded_at, grade, profiles(full_name), assignments(title, courses(title)), graded_by_profile:graded_by(full_name)")
      .not("graded_at", "is", null)
      .order("graded_at", { ascending: false })
      .limit(8),

    supabase
      .from("assignments")
      .select("id, title, created_at, courses(title, professor_id, profiles:professor_id(full_name))")
      .order("created_at", { ascending: false })
      .limit(6),

    supabase
      .from("applications")
      .select("id, full_name, program, status, created_at, region")
      .order("created_at", { ascending: false })
      .limit(6),

    admin.from("invoices").select("total_amount"),
    admin.from("payments").select("amount"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").not("completed_at", "is", null),
  ]);

  const totalBilled = (invoiceRows ?? []).reduce((sum, r) => sum + (r.total_amount ?? 0), 0);
  const totalCollected = (paymentRows ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/admin/applications" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Pending Apps</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{pendingCount ?? 0}</p>
        </Link>
        <Link href="/admin/students" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Students</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{studentCount ?? 0}</p>
          {(completedCount ?? 0) > 0 && (
            <p className="mt-0.5 text-xs text-green-600">{completedCount} completed</p>
          )}
        </Link>
        <Link href="/admin/courses" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Modules</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{courseCount ?? 0}</p>
          <p className="mt-0.5 text-xs text-slate-400">{programCount ?? 0} programs · {professorCount ?? 0} professors</p>
        </Link>
        <Link href="/admin/invoices" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Revenue</p>
          <p className="mt-1 text-2xl font-bold text-green-700">K{totalCollected.toLocaleString()}</p>
          {totalOutstanding > 0 && (
            <p className="mt-0.5 text-xs text-red-500">K{totalOutstanding.toLocaleString()} outstanding</p>
          )}
        </Link>
      </div>

      {/* Management section */}
      <h2 className="mt-10 text-lg font-semibold text-slate-800">Manage</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <Link href="/admin/applications" className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800 group-hover:text-gold-dark">Applications</p>
            {(pendingCount ?? 0) > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">Review, approve or reject applications. Approval auto-creates the student account and enrols them in their program modules.</p>
        </Link>

        <Link href="/admin/courses" className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold hover:shadow-md">
          <p className="font-semibold text-slate-800 group-hover:text-gold-dark">Modules (Courses)</p>
          <p className="text-sm text-slate-500">Add or edit modules. Assign a professor to each module. Students in the linked program are enrolled automatically.</p>
        </Link>

        <Link href="/admin/users" className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold hover:shadow-md">
          <p className="font-semibold text-slate-800 group-hover:text-gold-dark">Professors &amp; Users</p>
          <p className="text-sm text-slate-500">Invite professors, change user roles, and assign students to a program. Professors are assigned per module, not per student directly.</p>
        </Link>

        <Link href="/admin/programs" className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold hover:shadow-md">
          <p className="font-semibold text-slate-800 group-hover:text-gold-dark">Programs</p>
          <p className="text-sm text-slate-500">Create diploma or degree programs. Each program has its own set of modules and a lead professor. Students apply to a specific program.</p>
        </Link>

        <Link href="/admin/cohorts" className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold hover:shadow-md">
          <p className="font-semibold text-slate-800 group-hover:text-gold-dark">Cohorts / Terms</p>
          <p className="text-sm text-slate-500">Organise modules into intake terms (e.g. "Fall 2026"). Modules can be linked to a cohort for scheduling purposes.</p>
        </Link>

        <Link href="/admin/students" className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold hover:shadow-md">
          <p className="font-semibold text-slate-800 group-hover:text-gold-dark">Student Roster</p>
          <p className="text-sm text-slate-500">View all students grouped by program, track credit completion, and monitor progress across cohorts.</p>
        </Link>
      </div>

      {/* How assignment works */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-800">How student–professor assignment works</p>
        <p className="mt-1 text-sm text-blue-700">
          Students are assigned to professors <strong>automatically through modules</strong>. When you create a module and assign a professor to it, every student enrolled in that module is linked to that professor. When a student is approved and assigned to a program, they are instantly enrolled in all that program&apos;s modules — and therefore all the professors teaching those modules — with no extra steps required.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/courses" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            Manage Modules &amp; Assign Professors
          </Link>
          <Link href="/admin/programs" className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
            Manage Programs
          </Link>
        </div>
      </div>

      {/* Activity feed */}
      <h2 className="mt-10 text-lg font-semibold text-slate-800">Recent Activity</h2>
      <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Applications</h3>
            <Link href="/admin/applications" className="text-xs text-gold-dark hover:underline">View all</Link>
          </div>
          <div className="mt-3 space-y-2">
            {(recentApplications ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-800">{a.full_name}</span>
                  <span className="ml-1 text-slate-400">— {a.program}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    a.status === "approved" ? "bg-green-100 text-green-700"
                    : a.status === "rejected" ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>{a.status}</span>
                  <span className="text-xs text-slate-400">{timeAgo(a.created_at)}</span>
                </div>
              </div>
            ))}
            {(recentApplications ?? []).length === 0 && <p className="text-sm text-slate-400">No applications yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">New Assignments (Professors)</h3>
          <div className="mt-3 space-y-2">
            {(recentAssignments ?? []).map((a) => {
              const course = a.courses as unknown as { title: string; profiles: { full_name: string } | null } | null;
              return (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{a.title}</span>
                    <span className="ml-1 text-slate-400">— {course?.title}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{course?.profiles?.full_name ?? "Unassigned"}</p>
                    <p className="text-xs text-slate-400">{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              );
            })}
            {(recentAssignments ?? []).length === 0 && <p className="text-sm text-slate-400">No assignments yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">Recent Submissions (Students)</h3>
          <div className="mt-3 space-y-2">
            {(recentSubmissions ?? []).map((s) => {
              const student = s.profiles as unknown as { full_name: string } | null;
              const assignment = s.assignments as unknown as { title: string; courses: { title: string } | null } | null;
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{student?.full_name}</span>
                    <span className="ml-1 text-slate-400">— {assignment?.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.grade !== null ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Graded</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending</span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(s.submitted_at)}</span>
                  </div>
                </div>
              );
            })}
            {(recentSubmissions ?? []).length === 0 && <p className="text-sm text-slate-400">No submissions yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">Recent Grading (Professors)</h3>
          <div className="mt-3 space-y-2">
            {(recentGrades ?? []).map((s) => {
              const student = s.profiles as unknown as { full_name: string } | null;
              const assignment = s.assignments as unknown as { title: string; courses: { title: string } | null } | null;
              const gradedBy = s.graded_by_profile as unknown as { full_name: string } | null;
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{student?.full_name}</span>
                    <span className="ml-1 text-slate-400">— {assignment?.title}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-green-700">Grade: {s.grade}</p>
                    <p className="text-xs text-slate-400">by {gradedBy?.full_name ?? "Professor"} · {s.graded_at ? timeAgo(s.graded_at) : ""}</p>
                  </div>
                </div>
              );
            })}
            {(recentGrades ?? []).length === 0 && <p className="text-sm text-slate-400">No grades recorded yet.</p>}
          </div>
        </div>
      </div>

      {/* Application Links */}
      <h2 className="mt-10 text-lg font-semibold text-slate-800">Application Links</h2>
      <p className="mt-1 text-sm text-slate-500">Share these with prospective students.</p>
      <ApplyLinks />
    </div>
  );
}
