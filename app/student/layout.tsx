import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const LINKS = [
  { href: "/student", label: "My Courses" },
  { href: "/student/transcript", label: "Transcript" },
  { href: "/student/invoices", label: "Invoices" },
  { href: "/settings", label: "Settings" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["student"]);
  return <DashboardShell profile={profile} links={LINKS} activePortal="student">{children}</DashboardShell>;
}
