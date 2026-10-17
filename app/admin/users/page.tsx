import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { InviteUserForm } from "@/components/InviteUserForm";
import { UserSearchList } from "@/components/UserSearchList";
import type { Profile, Program } from "@/lib/types";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; invite_error?: string }>;
}) {
  const { invited, invite_error } = await searchParams;
  const supabase = createAdminClient();
  const admin = createAdminClient();

  const [viewer, { data: profiles }, { data: programs }, { data: authUsers }] = await Promise.all([
    getCurrentProfile(),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("programs").select("*").order("name", { ascending: true }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const lastSignInById: Record<string, string | null> = {};
  for (const u of authUsers?.users ?? []) {
    lastSignInById[u.id] = u.last_sign_in_at ?? null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>

      {invited && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Invite sent to {invited}.
        </div>
      )}
      {invite_error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {invite_error}
        </div>
      )}

      <InviteUserForm programs={(programs ?? []).map((p: Program) => ({ id: p.id, name: p.name }))} />

      <UserSearchList
        profiles={(profiles ?? []) as Profile[]}
        programs={(programs ?? []) as Program[]}
        viewerFinanceAccess={viewer?.finance_access ?? false}
        viewerId={viewer?.id ?? ""}
        lastSignInById={lastSignInById}
      />
    </div>
  );
}
