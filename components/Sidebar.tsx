"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/actions/auth";
import { NotificationBell } from "@/components/NotificationBell";
import type { Profile, Notification } from "@/lib/types";

export type NavGroup = {
  label?: string;
  links: { href: string; label: string }[];
};

// ── Icon paths (Heroicons outline) ─────────────────────────────────────────
const ICON: Record<string, string> = {
  "Dashboard":          "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  "Applications":       "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Students":           "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  "Import":             "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  "Progress":           "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "Users":              "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  "Invites":            "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "Programs":           "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  "Courses":            "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  "Modules":            "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  "Invoices":           "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z",
  "Payment Proofs":     "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "Prayer Board":       "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  "Notices":            "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  "Library":            "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
  "Calendar":           "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  "Handbook":           "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  "Audit":              "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  "Settings":           "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  "Prof. Hours":        "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  "Zoom Sessions":      "M15 10l4.553-2.276A1 1 0 0121 8.677V15.32a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  "Zoom & Recordings":  "M15 10l4.553-2.276A1 1 0 0121 8.677V15.32a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  "Zoom Register":      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  "Getting Started":    "M13 10V3L4 14h7v7l9-11h-7z",
  "My Courses":         "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  "Assignments":        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  "Transcript":         "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Attendance":         "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  "My Hours":           "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  "Grade Book":         "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "ID Card":            "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0",
  "Certificate":        "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
};
const FALLBACK = "M4 6h16M4 10h16M4 14h16M4 18h16";

function NavIcon({ label }: { label: string }) {
  return (
    <svg className="h-[17px] w-[17px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON[label] ?? FALLBACK} />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function Sidebar({
  profile,
  groups,
  activePortal,
  isAdmin,
  notifications,
}: {
  profile: Profile;
  groups: NavGroup[];
  activePortal?: "admin" | "student" | "professor";
  isAdmin: boolean;
  notifications: Notification[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Highlight the most-specific matching link only
  const allLinks = groups.flatMap(g => g.links);
  const activeHref = [...allLinks]
    .filter(l => {
      const exact = ["admin", "student", "professor", "settings"].some(p => l.href === `/${p}`);
      return exact ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + "/");
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

  const sidebarBody = (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Logo ── */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.jpg" alt="RBC" width={30} height={30} className="rounded-full ring-2 ring-gold/40 group-hover:ring-gold transition-all" />
          <div>
            <p className="text-sm font-bold text-gold leading-none">RBC</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Bible College</p>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {/* Desktop: bell in sidebar header */}
          <div className="hidden lg:block">
            <NotificationBell notifications={notifications} />
          </div>
          {/* Mobile: close drawer */}
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/10 transition-colors lg:hidden">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Portal switcher (admin only) ── */}
      {isAdmin && activePortal && (
        <div className="px-3 pt-3 pb-2 border-b border-white/8">
          <p className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-widest text-slate-600">Switch Portal</p>
          <div className="flex gap-1 rounded-lg bg-white/5 p-1">
            {([
              { portal: "admin" as const,     href: "/admin",     label: "Admin"   },
              { portal: "student" as const,   href: "/student",   label: "Student" },
              { portal: "professor" as const, href: "/professor", label: "Prof."   },
            ] as const).map(({ portal, href, label }) => (
              <Link
                key={portal}
                href={href}
                className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-semibold transition-all duration-150 ${
                  activePortal === portal
                    ? "bg-gold text-ink shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="mb-1 ml-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const active = link.href === activeHref;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                        active
                          ? "bg-gold/15 text-gold font-semibold"
                          : "text-slate-400 hover:bg-white/6 hover:text-slate-200 font-medium"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-gold" />
                      )}
                      <NavIcon label={link.label} />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div className="shrink-0 border-t border-white/8 p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.full_name} className="h-8 w-8 rounded-full object-cover ring-1 ring-gold/30" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-200 leading-tight">{profile.full_name}</p>
            <p className="text-[11px] text-slate-500 capitalize leading-tight">{profile.role}</p>
          </div>
          <form action={logout}>
            <button title="Sign out" className="rounded-lg p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/8 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (fixed) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-ink shadow-xl lg:flex flex-col">
        {sidebarBody}
      </aside>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          style={{ animation: "sidebarOverlay 0.2s ease-out" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-ink flex flex-col shadow-2xl lg:hidden transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarBody}
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between bg-ink px-4 shadow-sm lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="RBC" width={24} height={24} className="rounded-full ring-1 ring-gold/40" />
          <span className="text-sm font-bold text-gold">RBC</span>
        </Link>
        <NotificationBell notifications={notifications} />
      </header>
    </>
  );
}
