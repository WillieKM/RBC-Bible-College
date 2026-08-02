import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const LINKS = [
  { href: "/professor/getting-started", label: "Getting Started" },
  { href: "/professor", label: "My Courses" },
  { href: "/professor/assignments", label: "Assignments" },
  { href: "/professor/gradebook", label: "Grade Book" },
  { href: "/professor/modules", label: "Modules" },
  { href: "/professor/hours", label: "My Hours" },
  { href: "/professor/zoom", label: "Zoom & Recordings" },
  { href: "/professor/zoom-attendance", label: "Zoom Register" },
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
