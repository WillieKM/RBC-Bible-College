import { createClient } from "@/lib/supabase/server";
import { inviteUser, updateUserRole } from "@/lib/actions/admin";
import type { Profile } from "@/lib/types";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

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
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">{p.full_name}</p>
              <p className="text-sm text-slate-500">{p.email}</p>
            </div>
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
          </div>
        ))}
        {(profiles ?? []).length === 0 && <p className="text-sm text-slate-500">No users yet.</p>}
      </div>
    </div>
  );
}
