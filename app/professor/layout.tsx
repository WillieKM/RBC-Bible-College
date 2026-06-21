import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const LINKS = [
  { href: "/professor", label: "My Courses" },
  { href: "/professor/calendar", label: "Calendar" },
  { href: "/professor/handbook", label: "Handbook" },
  { href: "/settings", label: "Settings" },
];

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["professor"]);
  return <DashboardShell profile={profile} links={LINKS} activePortal="professor">{children}</DashboardShell>;
}
