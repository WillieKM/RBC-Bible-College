import { createClient } from "@/lib/supabase/server";
import { ApplicationSearchList, type ComputedApplication } from "@/components/ApplicationSearchList";
import { FEE_SCHEDULE, ENROLLMENT_FEES } from "@/lib/fees";
import type { Application, ProgramLevel } from "@/lib/types";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; resent?: string }>;
}) {
  const { error, resent } = await searchParams;
  const supabase = await createClient();

  const [{ data: applications }, { data: profiles }, { data: programs }] = await Promise.all([
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("email, student_number, full_name"),
    supabase.from("programs").select("id, name, fee_usa, fee_international, enrollment_fee_usa, enrollment_fee_international, program_level"),
  ]);

  const profileByEmail = new Map((profiles ?? []).map((p: { email: string; student_number: string | null; full_name: string }) => [p.email, p]));
  const programByName = new Map((programs ?? []).map((p) => [p.name as string, p]));

  // Track duplicates in pending
  const pendingApps = (applications ?? []).filter((a: Application) => a.status === "pending");
  const reviewedApps = (applications ?? []).filter((a: Application) => a.status !== "pending");

  const pendingEmailCount = new Map<string, number>();
  for (const a of pendingApps) pendingEmailCount.set(a.email, (pendingEmailCount.get(a.email) ?? 0) + 1);

  function toComputed(app: Application): ComputedApplication {
    const region = app.region === "usa" ? "usa" : "international";
    const level = app.program_level as ProgramLevel;
    const prog = programByName.get(app.program);
    const programFee = (region === "usa" ? prog?.fee_usa : prog?.fee_international) ?? FEE_SCHEDULE[level]?.[region] ?? 0;
    const enrollFee = (region === "usa" ? prog?.enrollment_fee_usa : prog?.enrollment_fee_international) ?? ENROLLMENT_FEES[level]?.[region] ?? 0;
    const currency = region === "usa" ? "$" : "KSh";
    const profile = profileByEmail.get(app.email);
    return {
      id: app.id,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone ?? null,
      program: app.program,
      program_level: app.program_level,
      region: app.region ?? null,
      statement: app.statement ?? null,
      photo_url: app.photo_url ?? null,
      status: app.status,
      details: (app.details as Record<string, unknown>) ?? null,
      isDuplicate: (pendingEmailCount.get(app.email) ?? 1) > 1,
      profileStudentNumber: profile?.student_number ?? null,
      currency,
      programFee,
      enrollFee,
    };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Applications</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {resent && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          New login link sent — student should receive the email shortly.
        </div>
      )}

      <ApplicationSearchList
        pending={pendingApps.map(toComputed)}
        reviewed={reviewedApps.map(toComputed)}
      />
    </div>
  );
}
