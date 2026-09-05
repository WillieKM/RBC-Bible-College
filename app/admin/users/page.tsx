import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { InviteUserForm } from "@/components/InviteUserForm";
import { UserSearchList } from "@/components/UserSearchList";
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

      <InviteUserForm programs={(programs ?? []).map((p: Program) => ({ id: p.id, name: p.name }))} />

      <UserSearchList
        profiles={(profiles ?? []) as Profile[]}
        programs={(programs ?? []) as Program[]}
        viewerFinanceAccess={viewer?.finance_access ?? false}
        viewerId={viewer?.id ?? ""}
      />
    </div>
  );
}
