import { logout } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

export function DashboardShell({
  profile,
  links,
  children,
  activePortal,
}: {
  profile: Profile;
  links: { href: string; label: string }[];
  children: React.ReactNode;
  activePortal?: "admin" | "student" | "professor";
}) {
  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50">
      {isAdmin && activePortal && (
        <div className="border-b border-gold/40 bg-ink-light px-4 py-2">
          <div className="mx-auto flex max-w-5xl items-center gap-1.5">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              View as:
            </span>
            {(
              [
                { portal: "admin" as const, href: "/admin", label: "Admin" },
                { portal: "student" as const, href: "/student", label: "Student" },
                { portal: "professor" as const, href: "/professor", label: "Professor" },
              ] as const
            ).map(({ portal, href, label }) => (
              <Link
                key={portal}
                href={href}
                className={`rounded px-3 py-0.5 text-xs font-semibold transition-colors ${
                  activePortal === portal
                    ? "bg-gold text-ink"
                    : "text-slate-400 hover:bg-gold/10 hover:text-gold"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <header className="border-b border-gold/20 bg-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.jpg"
                alt="Revelation Bible College International"
                width={32}
                height={32}
                className="rounded-full"
              />
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
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-gold/40"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-slate-400">
              {profile.full_name}{" "}
              <span className="text-slate-500">({profile.role})</span>
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
