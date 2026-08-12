import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNavGroups } from "@/lib/portal-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["student"]);
  return (
    <DashboardShell profile={profile} groups={studentNavGroups(profile)} activePortal="student">
      {children}
    </DashboardShell>
  );
}
