"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavItem = {
  href: string;
  label: string;
  icon: string; // SVG path d attribute
};

const STUDENT_ITEMS: BottomNavItem[] = [
  {
    href: "/student",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/student/assignments",
    label: "Assignments",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    href: "/student/modules",
    label: "Modules",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    href: "/student/invoices",
    label: "Invoices",
    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
  },
  {
    href: "/student/zoom",
    label: "Zoom",
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.656v6.688a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
];

const PROFESSOR_ITEMS: BottomNavItem[] = [
  {
    href: "/professor",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/professor/assignments",
    label: "Grade",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    href: "/professor/gradebook",
    label: "Grades",
    icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
  {
    href: "/professor/zoom",
    label: "Zoom",
    icon: "M15 10l4.553-2.276A1 1 0 0121 8.656v6.688a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
  {
    href: "/professor/getting-started",
    label: "Guide",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function BottomNav({ portal }: { portal: "student" | "professor" }) {
  const pathname = usePathname();
  const items = portal === "student" ? STUDENT_ITEMS : PROFESSOR_ITEMS;

  function isActive(href: string) {
    if (href === "/student" || href === "/professor") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition-colors ${
                active ? "text-gold" : "text-slate-400 hover:text-slate-600"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon d={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iPhone home indicator */}
      <div className="h-safe-bottom bg-white" />
    </nav>
  );
}
