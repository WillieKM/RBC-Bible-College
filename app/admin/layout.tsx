import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/announcements", label: "Notices" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/handbook", label: "Handbook" },
  { href: "/admin/audit", label: "Audit" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  return <DashboardShell profile={profile} links={LINKS} activePortal="admin">{children}</DashboardShell>;
}
