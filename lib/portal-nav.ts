import type { NavGroup } from "@/components/Sidebar";
import type { Profile } from "@/lib/types";

export function adminNavGroups(profile: Profile): NavGroup[] {
  return [
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
          } satisfies NavGroup,
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
}

export function studentNavGroups(profile: Profile): NavGroup[] {
  return [
    {
      links: [{ href: "/student/getting-started", label: "Getting Started" }],
    },
    {
      label: "Study",
      links: [
        { href: "/student", label: "My Courses" },
        { href: "/student/assignments", label: "Assignments" },
        { href: "/student/modules", label: "Modules" },
        { href: "/student/zoom", label: "Zoom & Recordings" },
        { href: "/student/transcript", label: "Transcript" },
        { href: "/student/attendance", label: "Attendance" },
      ],
    },
    {
      label: "Finance",
      links: [{ href: "/student/invoices", label: "Invoices" }],
    },
    {
      label: "Community",
      links: [
        { href: "/student/announcements", label: "Notices" },
        { href: "/student/prayers", label: "Prayer Board" },
        { href: "/student/library", label: "Library" },
        { href: "/student/calendar", label: "Calendar" },
        { href: "/student/handbook", label: "Handbook" },
      ],
    },
    {
      links: [
        { href: "/student/id-card", label: "ID Card" },
        ...(profile.completed_at ? [{ href: "/student/certificate", label: "Certificate" }] : []),
        { href: "/settings", label: "Settings" },
      ],
    },
  ];
}

export function professorNavGroups(): NavGroup[] {
  return [
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
}

export function getNavGroups(profile: Profile): NavGroup[] {
  if (profile.role === "admin")     return adminNavGroups(profile);
  if (profile.role === "professor") return professorNavGroups();
  return studentNavGroups(profile);
}
