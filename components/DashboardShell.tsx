import { logout } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import Link from "next/link";

export function DashboardShell({
  profile,
  links,
  children,
}: {
  profile: Profile;
  links: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-slate-900">Bible School Admin</span>
            <nav className="flex gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-blue-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {profile.full_name} <span className="text-slate-400">({profile.role})</span>
            </span>
            <form action={logout}>
              <button className="text-sm font-medium text-slate-500 hover:text-red-600">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
