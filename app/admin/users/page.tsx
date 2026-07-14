import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { inviteUser, updateUserRole, updateFinanceAccess, updateStudentProgram, resendInvite, revokeAccess, restoreAccess, deleteUser } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";
import { TypeToConfirmButton } from "@/components/TypeToConfirmButton";
import type { Profile, Program } from "@/lib/types";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [viewer, { data: profiles }, { data: programs }] = await Promise.all([
    getCurrentProfile(),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("programs").select("*").order("name", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>

      <form action={inviteUser} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700">Full name</label>
          <input name="full_name" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input name="email" type="email" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <select name="role" defaultValue="professor" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="admin">Admin</option>
            <option value="professor">Professor</option>
            <option value="student">Student</option>
          </select>
        </div>
        <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
          Invite User
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(profiles ?? []).map((p: Profile) => (
          <div key={p.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${p.banned ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900">{p.full_name}</p>
                {p.banned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Access revoked</span>}
              </div>
              <p className="text-sm text-slate-500">{p.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <form action={resendInvite}>
                <input type="hidden" name="email" value={p.email} />
                <DeleteButton label="Resend invite" pendingLabel="Sending…" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50" />
              </form>
              {p.banned ? (
                <form action={restoreAccess}>
                  <input type="hidden" name="id" value={p.id} />
                  <DeleteButton label="Restore access" pendingLabel="Restoring…" className="rounded-lg border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50" />
                </form>
              ) : (
                <form action={revokeAccess}>
                  <input type="hidden" name="id" value={p.id} />
                  <DeleteButton label="Revoke access" pendingLabel="Revoking…" className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50" />
                </form>
              )}
              {viewer?.finance_access && p.id !== viewer?.id && (
                <TypeToConfirmButton
                  formAction={deleteUser}
                  hiddenFields={{ id: p.id }}
                  userName={p.full_name}
                />
              )}
              <form action={updateUserRole} className="flex items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <select name="role" defaultValue={p.role} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                  <option value="admin">Admin</option>
                  <option value="professor">Professor</option>
                  <option value="student">Student</option>
                </select>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Save
                </button>
              </form>
              {p.role === "admin" && viewer?.finance_access && (
                <form action={updateFinanceAccess} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="finance_access" value={p.finance_access ? "0" : "1"} />
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    {p.finance_access ? "Revoke finance access" : "Grant finance access"}
                  </button>
                </form>
              )}
              {p.role === "student" && (
                <form action={updateStudentProgram} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <select name="program_id" defaultValue={p.program_id ?? ""} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                    <option value="">No program</option>
                    {(programs ?? []).map((program: Program) => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Save
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {(profiles ?? []).length === 0 && <p className="text-sm text-slate-500">No users yet.</p>}
      </div>
    </div>
  );
}
