import { createClient } from "@/lib/supabase/server";
import type { Profile, Notification } from "@/lib/types";
import { Sidebar, type NavGroup } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

const PORTAL_LABEL = { admin: "Admin", student: "Student", professor: "Professor" } as const;

export async function DashboardShell({
  profile,
  groups,
  children,
  activePortal,
}: {
  profile: Profile;
  groups: NavGroup[];
  children: React.ReactNode;
  activePortal?: "admin" | "student" | "professor";
}) {
  const isAdmin = profile.role === "admin";

  // For dual-access users (e.g. student + professor), the portal they're not currently in.
  const otherPortal =
    activePortal && profile.secondary_role
      ? [profile.role, profile.secondary_role].find((r) => r !== activePortal) ?? null
      : null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const notifications = (data ?? []) as Notification[];

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        profile={profile}
        groups={groups}
        activePortal={activePortal}
        isAdmin={isAdmin}
        notifications={notifications}
      />

      {/* Content area — offset for fixed sidebar on desktop, mobile top bar */}
      <div className="lg:ml-60 pt-14 lg:pt-0 flex flex-col min-h-screen">

        {/* Admin preview banner */}
        {isAdmin && activePortal && activePortal !== "admin" && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5">
            <p className="text-xs text-amber-700">
              Previewing the{" "}
              <span className="font-semibold capitalize">{activePortal}</span>{" "}
              portal — your admin account isn&apos;t enrolled as a{" "}
              {activePortal}, so personal course data won&apos;t appear here.
            </p>
          </div>
        )}

        {/* Dual-access switch bar — the sidebar switcher is hidden in the mobile drawer */}
        {!isAdmin && otherPortal && (
          <div className="border-b border-gold/30 bg-gold/10 px-4 py-2 sm:px-6">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <p className="text-xs text-slate-700">
                You&apos;re in the <span className="font-semibold">{PORTAL_LABEL[activePortal!]}</span> portal.
              </p>
              <Link
                href={`/${otherPortal}`}
                className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gold-dark"
              >
                Switch to {PORTAL_LABEL[otherPortal]} →
              </Link>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-5xl w-full mx-auto pb-20 lg:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {(activePortal === "student" || activePortal === "professor") && (
        <BottomNav portal={activePortal} />
      )}
    </div>
  );
}
