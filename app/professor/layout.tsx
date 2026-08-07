import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import type { NavGroup } from "@/components/Sidebar";

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["professor"]);

  const groups: NavGroup[] = [
    {
      links: [{ href: "/professor/getting-started", label: "Getting Started" }],
    },
    {
      label: "Teaching",
      links: [
        { href: "/professor", label: "My Courses" },
        { href: "/professor/assignments", label: "Assignments" },
        { href: "/professor/gradebook", label: "Grade Book" },
        { href: "/professor/modules", label: "Modules" },
      ],
    },
    {
      label: "Attendance",
      links: [
        { href: "/professor/hours", label: "My Hours" },
        { href: "/professor/zoom", label: "Zoom & Recordings" },
        { href: "/professor/zoom-attendance", label: "Zoom Register" },
      ],
    },
    {
      label: "Community",
      links: [
        { href: "/professor/announcements", label: "Notices" },
        { href: "/professor/prayers", label: "Prayer Board" },
        { href: "/professor/library", label: "Library" },
        { href: "/professor/calendar", label: "Calendar" },
        { href: "/professor/handbook", label: "Handbook" },
      ],
    },
    {
      links: [{ href: "/settings", label: "Settings" }],
    },
  ];

  return (
    <DashboardShell profile={profile} groups={groups} activePortal="professor">
      {children}
    </DashboardShell>
  );
}
