import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const BASE_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/progress", label: "Progress" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/courses", label: "Courses" },
];

const FINANCE_LINK = { href: "/admin/invoices", label: "Invoices" };
const PROOFS_LINK = { href: "/admin/invoices/proofs", label: "Payment Proofs" };

const REST_LINKS = [
  { href: "/admin/modules", label: "Modules" },
  { href: "/admin/prayers", label: "Prayer Board" },
  { href: "/admin/hours", label: "Prof. Hours" },
  { href: "/admin/zoom", label: "Zoom Sessions" },
  { href: "/admin/announcements", label: "Notices" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/handbook", label: "Handbook" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  const links = profile.finance_access ? [...BASE_LINKS, FINANCE_LINK, PROOFS_LINK, ...REST_LINKS] : [...BASE_LINKS, ...REST_LINKS];
  return <DashboardShell profile={profile} links={links} activePortal="admin">{children}</DashboardShell>;
}
