import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [{ count: pendingCount }, { count: courseCount }, { count: studentCount }] = await Promise.all([
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/admin/applications" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Pending Applications</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount ?? 0}</p>
        </Link>
        <Link href="/admin/courses" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Courses</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{courseCount ?? 0}</p>
        </Link>
        <Link href="/admin/users" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-gold">
          <p className="text-sm font-medium text-slate-500">Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{studentCount ?? 0}</p>
        </Link>
      </div>
    </div>
  );
}
