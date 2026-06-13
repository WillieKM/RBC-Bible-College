import { logout } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

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
      <header className="border-b border-gold/20 bg-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="Revelation Bible College International" width={32} height={32} className="rounded-full" />
              <span className="font-bold text-gold">Revelation Bible College</span>
            </Link>
            <nav className="flex gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-300 hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {profile.full_name} <span className="text-slate-500">({profile.role})</span>
            </span>
            <form action={logout}>
              <button className="text-sm font-medium text-slate-400 hover:text-red-400">
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
