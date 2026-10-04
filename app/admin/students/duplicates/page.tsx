import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { mergeStudentProfiles } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";

export default async function DuplicateProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ merged?: string }>;
}) {
  await requireRole(["admin"]);
  const { merged } = await searchParams;
  const admin = createAdminClient();

  const { data: allProfiles } = await admin
    .from("profiles")
    .select("id, full_name, email, role, student_number, program_id, avatar_url, phone, region, created_at, programs(name)")
    .order("email")
    .order("created_at");

  // Group by email, keep groups with more than one profile
  const byEmail = new Map<string, typeof allProfiles>();
  for (const p of allProfiles ?? []) {
    const list = byEmail.get(p.email) ?? [];
    list.push(p);
    byEmail.set(p.email, list);
  }

  type ProfileRow = NonNullable<typeof allProfiles>[number];
  const duplicateGroups: ProfileRow[][] = [];
  for (const [, group] of byEmail) {
    if (!group || group.length < 2) continue;
    // Only flag if in the same program (or either has no program)
    const programs = new Set(group.map((p) => (p.programs as unknown as { name: string } | null)?.name ?? null));
    const sameProgram = programs.size === 1; // all null counts as same
    if (sameProgram) duplicateGroups.push(group);
    else {
      // Different programs — still show but mark as different
      duplicateGroups.push(group);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/students" className="text-sm text-gold-dark hover:underline">← Back to students</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Duplicate Email Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Profiles sharing the same email. Choose which to keep — the other&apos;s enrollments, submissions, invoices, and attendance will be transferred first.
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
          {duplicateGroups.length} group{duplicateGroups.length !== 1 ? "s" : ""}
        </span>
      </div>

      {merged && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Profiles merged — duplicate removed.
        </div>
      )}

      {duplicateGroups.length === 0 ? (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-lg font-semibold text-green-700">No duplicate emails found</p>
          <p className="mt-1 text-sm text-green-600">All profile emails are unique.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {duplicateGroups.map((group) => {
            const programs = new Set(group.map((p) => (p.programs as unknown as { name: string } | null)?.name ?? "No program"));
            const differentPrograms = programs.size > 1;
            return (
              <div key={group[0].email} className="rounded-xl border border-amber-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-4 py-3 rounded-t-xl">
                  <div>
                    <p className="font-semibold text-slate-800">{group[0].email}</p>
                    <p className="text-xs text-slate-500">{group.length} accounts</p>
                  </div>
                  {differentPrograms && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Different programs
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100">
                  {group.map((profile, i) => {
                    const prog = (profile.programs as unknown as { name: string } | null)?.name;
                    const others = group.filter((_, j) => j !== i);
                    return (
                      <div key={profile.id} className="flex items-center gap-4 px-4 py-4">
                        {profile.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.avatar_url} alt={profile.full_name} className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400">
                            {profile.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{profile.full_name}</p>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                            <span className="capitalize">{profile.role}</span>
                            {profile.student_number && <span>{profile.student_number}</span>}
                            {prog && <span>{prog}</span>}
                            {profile.region && <span className="capitalize">{profile.region}</span>}
                            {profile.phone && <span>{profile.phone}</span>}
                            <span>Created {new Date(profile.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          {others.map((other) => (
                            <form key={other.id} action={mergeStudentProfiles}>
                              <input type="hidden" name="keep_id" value={profile.id} />
                              <input type="hidden" name="delete_id" value={other.id} />
                              <DeleteButton
                                label="Keep this, delete other"
                                pendingLabel="Merging…"
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50 whitespace-nowrap"
                              />
                            </form>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
