import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNavGroups } from "@/lib/portal-nav";
import { getProgramLevel } from "@/lib/research-server";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["student"]);
  const programLevel = await getProgramLevel(profile.program_id);

  return (
    <DashboardShell profile={profile} groups={studentNavGroups(profile, programLevel)} activePortal="student">
      {children}
    </DashboardShell>
  );
}
