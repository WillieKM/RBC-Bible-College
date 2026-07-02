import { createAdminClient } from "@/lib/supabase/admin";
import { ZoomRollCall } from "@/components/ZoomRollCall";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ZoomSession } from "@/lib/types";

async function getStudents(admin: ReturnType<typeof createAdminClient>, audience: string) {
  let query = admin.from("profiles").select("id, full_name, email").eq("role", "student").order("full_name");

  if (audience === "all") return query;

  if (["doctorate", "bachelors", "masters"].includes(audience)) {
    const { data: programs } = await admin.from("programs").select("id").eq("program_level", audience);
    const ids = (programs ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return { data: [] };
    return query.in("program_id", ids);
  }

  const name = audience === "diploma" ? "Diploma" : "Certificate";
  const { data: prog } = await admin.from("programs").select("id").eq("name", name).maybeSingle();
  if (!prog) return { data: [] };
  return query.eq("program_id", prog.id);
}

export default async function AdminZoomAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const admin = createAdminClient();

  const { data: sessionRaw } = await admin.from("zoom_sessions").select("*").eq("id", id).single();
  if (!sessionRaw) notFound();
  const session = sessionRaw as ZoomSession;

  const [{ data: studentsRaw }, { data: pastRaw }] = await Promise.all([
    getStudents(admin, session.target_audience),
    admin.from("zoom_attendance")
      .select("student_id, session_date, present")
      .eq("zoom_session_id", id)
      .order("session_date", { ascending: false }),
  ]);

  const students = (studentsRaw ?? []) as { id: string; full_name: string; email: string }[];

  // Build a map of studentId -> present for the most recent recorded session
  const existingByStudent = new Map<string, boolean>();
  const pastDates = [...new Set((pastRaw ?? []).map((r: { session_date: string }) => r.session_date))].slice(0, 10);
  const latestDate = pastDates[0];
  if (latestDate) {
    for (const r of (pastRaw ?? []).filter((r: { session_date: string }) => r.session_date === latestDate)) {
      existingByStudent.set(r.student_id, r.present);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/zoom" className="text-sm text-gold-dark hover:underline">← Zoom Sessions</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Attendance — {session.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{session.target_audience === "all" ? "All students" : session.target_audience}</p>

      {saved && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Attendance saved successfully.
        </div>
      )}

      <div className="mt-6">
        <ZoomRollCall
          sessionId={id}
          sessionTitle={session.title}
          students={students}
          existingByStudent={existingByStudent}
          pastDates={pastDates}
          returnPath={`/admin/zoom/${id}/attendance`}
        />
      </div>
    </div>
  );
}
