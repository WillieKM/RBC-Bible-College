import { createClient } from "@/lib/supabase/server";
import type { Profile, Notification } from "@/lib/types";
import { Sidebar, type NavGroup } from "@/components/Sidebar";
import { PageTransition } from "@/components/PageTransition";

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

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-5xl w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
