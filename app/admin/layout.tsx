import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  return <DashboardShell profile={profile} links={LINKS} activePortal="admin">{children}</DashboardShell>;
}
