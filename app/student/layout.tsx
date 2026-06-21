import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["student"]);

  const links = [
    { href: "/student", label: "My Courses" },
    { href: "/student/transcript", label: "Transcript" },
    { href: "/student/attendance", label: "Attendance" },
    { href: "/student/invoices", label: "Invoices" },
    { href: "/student/announcements", label: "Notices" },
    { href: "/student/prayers", label: "Prayer Board" },
    { href: "/student/library", label: "Library" },
    { href: "/student/calendar", label: "Calendar" },
    { href: "/student/handbook", label: "Handbook" },
    { href: "/student/id-card", label: "ID Card" },
    ...(profile.completed_at ? [{ href: "/student/certificate", label: "Certificate" }] : []),
    { href: "/settings", label: "Settings" },
  ];

  return <DashboardShell profile={profile} links={links} activePortal="student">{children}</DashboardShell>;
}
