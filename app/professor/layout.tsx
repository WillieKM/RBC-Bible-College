import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const LINKS = [
  { href: "/professor", label: "My Courses" },
];

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["professor"]);
  return <DashboardShell profile={profile} links={LINKS}>{children}</DashboardShell>;
}
