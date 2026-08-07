import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import type { NavGroup } from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);

  const groups: NavGroup[] = [
    {
      links: [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/applications", label: "Applications" },
      ],
    },
    {
      label: "People",
      links: [
        { href: "/admin/students", label: "Students" },
        { href: "/admin/students/import", label: "Import" },
        { href: "/admin/progress", label: "Progress" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/invites", label: "Invites" },
      ],
    },
    {
      label: "Academic",
      links: [
        { href: "/admin/programs", label: "Programs" },
        { href: "/admin/courses", label: "Courses" },
        { href: "/admin/modules", label: "Modules" },
      ],
    },
    ...(profile.finance_access
      ? [
          {
            label: "Finance",
            links: [
              { href: "/admin/invoices", label: "Invoices" },
              { href: "/admin/invoices/proofs", label: "Payment Proofs" },
            ],
          },
        ]
      : []),
    {
      label: "Community",
      links: [
        { href: "/admin/prayers", label: "Prayer Board" },
        { href: "/admin/announcements", label: "Notices" },
        { href: "/admin/library", label: "Library" },
        { href: "/admin/calendar", label: "Calendar" },
        { href: "/admin/handbook", label: "Handbook" },
      ],
    },
    {
      label: "System",
      links: [
        { href: "/admin/hours", label: "Prof. Hours" },
        { href: "/admin/zoom", label: "Zoom Sessions" },
        { href: "/admin/audit", label: "Audit" },
        { href: "/settings", label: "Settings" },
      ],
    },
  ];

  return (
    <DashboardShell profile={profile} groups={groups} activePortal="admin">
      {children}
    </DashboardShell>
  );
}
