import { createAdminClient } from "@/lib/supabase/admin";
import { resendInvite } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";

export default async function AdminInvitesPage() {
  const admin = createAdminClient();

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000, page: 1 }),
    admin.from("profiles").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }),
  ]);

  const neverLoggedIn = new Set(
    (authData?.users ?? []).filter((u) => !u.last_sign_in_at).map((u) => u.id)
  );

  const pending = (profiles ?? []).filter(
    (p: { id: string; role: string }) => neverLoggedIn.has(p.id) && p.role !== "admin"
  ) as { id: string; full_name: string; email: string; role: string; created_at: string }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Pending Invites</h1>
      <p className="mt-1 text-sm text-slate-500">
        Users who have been invited but have not logged in yet.
      </p>

      {pending.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">All invited users have logged in.</p>
      ) : (
        <>
          <p className="mt-4 text-sm font-medium text-amber-700">
            {pending.length} pending invite{pending.length !== 1 ? "s" : ""}
          </p>
          <div className="mt-3 space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{p.full_name}</p>
                  <p className="text-sm text-slate-500">{p.email}</p>
                  <p className="text-xs text-slate-400">
                    {p.role} · Invited {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <form action={resendInvite}>
                  <input type="hidden" name="email" value={p.email} />
                  <DeleteButton
                    label="Resend invite"
                    pendingLabel="Sending…"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  />
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
