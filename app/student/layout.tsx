import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNavGroups } from "@/lib/portal-nav";
import { redirect } from "next/navigation";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["student"]);

  if (!profile.avatar_url) {
    redirect("/settings?require_photo=1");
  }

  return (
    <DashboardShell profile={profile} groups={studentNavGroups(profile)} activePortal="student">
      {children}
    </DashboardShell>
  );
}
