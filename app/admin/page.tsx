import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [{ count: pendingCount }, { count: programCount }, { count: courseCount }, { count: studentCount }] = await Promise.all([
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("programs").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
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
    </div>
  );
}
