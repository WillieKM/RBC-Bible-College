import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNavGroups } from "@/lib/portal-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  return (
    <DashboardShell profile={profile} groups={adminNavGroups(profile)} activePortal="admin">
      {children}
    </DashboardShell>
  );
}
