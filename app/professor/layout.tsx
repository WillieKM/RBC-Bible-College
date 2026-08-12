import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { professorNavGroups } from "@/lib/portal-nav";

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["professor"]);
  return (
    <DashboardShell profile={profile} groups={professorNavGroups()} activePortal="professor">
      {children}
    </DashboardShell>
  );
}
