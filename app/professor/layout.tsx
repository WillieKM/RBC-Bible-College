import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const LINKS = [
  { href: "/professor", label: "My Courses" },
  { href: "/professor/announcements", label: "Notices" },
  { href: "/professor/prayers", label: "Prayer Board" },
  { href: "/professor/library", label: "Library" },
  { href: "/professor/calendar", label: "Calendar" },
  { href: "/professor/handbook", label: "Handbook" },
  { href: "/settings", label: "Settings" },
];

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["professor"]);
  return <DashboardShell profile={profile} links={LINKS} activePortal="professor">{children}</DashboardShell>;
}
