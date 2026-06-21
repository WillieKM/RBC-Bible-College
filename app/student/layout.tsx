import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["student"]);

  const links = [
    { href: "/student", label: "My Courses" },
    { href: "/student/transcript", label: "Transcript" },
    { href: "/student/invoices", label: "Invoices" },
    { href: "/student/calendar", label: "Calendar" },
    { href: "/student/handbook", label: "Handbook" },
    ...(profile.completed_at ? [{ href: "/student/certificate", label: "Certificate" }] : []),
    { href: "/settings", label: "Settings" },
  ];

  return <DashboardShell profile={profile} links={links} activePortal="student">{children}</DashboardShell>;
}
