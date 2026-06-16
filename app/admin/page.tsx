import { createClient } from "@/lib/supabase/server";
import { ApplyLinks } from "@/components/ApplyLinks";
import Link from "next/link";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [
    { count: pendingCount },
    { count: programCount },
    { count: courseCount },
    { count: studentCount },
    { data: recentSubmissions },
    { data: recentGrades },
    { data: recentAssignments },
    { data: recentApplications },
  ] = await Promise.all([
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),

    // Recent student submissions
    supabase
      .from("submissions")
      .select("id, submitted_at, student_id, assignment_id, grade, profiles(full_name), assignments(title, courses(title))")
      .order("submitted_at", { ascending: false })
      .limit(8),

    // Recently graded
    supabase
      .from("submissions")
      .select("id, graded_at, grade, profiles(full_name), assignments(title, courses(title)), graded_by_profile:graded_by(full_name)")
      .not("graded_at", "is", null)
      .order("graded_at", { ascending: false })
      .limit(8),

    // Recently created assignments
    supabase
      .from("assignments")
      .select("id, title, created_at, courses(title, professor_id, profiles:professor_id(full_name))")
      .order("created_at", { ascending: false })
      .limit(6),

    // Recent applications
    supabase
      .from("applications")
      .select("id, full_name, program, status, created_at, region")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/student" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-gold hover:text-gold">
            Student View
          </Link>
          <Link href="/professor" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-gold hover:text-gold">
            Professor View
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Link href="/admin/applications" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Pending Applications</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount ?? 0}</p>
        </Link>
        <Link href="/admin/programs" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Programs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{programCount ?? 0}</p>
        </Link>
        <Link href="/admin/courses" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Modules</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{courseCount ?? 0}</p>
        </Link>
        <Link href="/admin/students" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{studentCount ?? 0}</p>
        </Link>
      </div>

      {/* Activity feed */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recent applications */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Applications</h2>
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

        {/* Recent assignments created by professors */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">New Assignments (Professors)</h2>
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

        {/* Recent student submissions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Recent Submissions (Students)</h2>
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

        {/* Recent grading activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Recent Grading (Professors)</h2>
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

      <h2 className="mt-8 text-lg font-semibold text-slate-800">Quick Links</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link href="/admin/applications" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-gold hover:bg-slate-50">
          Review Applications
        </Link>
        <Link href="/admin/programs" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-gold hover:bg-slate-50">
          Manage Programs
        </Link>
        <Link href="/admin/courses" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-gold hover:bg-slate-50">
          Manage Modules
        </Link>
        <Link href="/admin/cohorts" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-gold hover:bg-slate-50">
          Manage Cohorts
        </Link>
        <Link href="/admin/students" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-gold hover:bg-slate-50">
          View Students
        </Link>
        <Link href="/admin/users" className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-gold hover:bg-slate-50">
          Manage Users
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-800">Application Links</h2>
      <p className="mt-1 text-sm text-slate-500">Share these with prospective students.</p>
      <ApplyLinks />
    </div>
  );
}
