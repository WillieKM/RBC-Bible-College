import { getCurrentProfile } from "@/lib/auth";
import { updateProfile } from "@/lib/actions/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { redirect } from "next/navigation";
import Link from "next/link";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  professor: "/professor",
  student: "/student",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { saved } = await searchParams;

  const backHref = ROLE_HOME[profile.role] ?? "/";

  return (
    <DashboardShell
      profile={profile}
      links={[{ href: backHref, label: "← Back to Dashboard" }]}
      activePortal={profile.role as "admin" | "student" | "professor"}
    >
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Update your name, photo, or password.</p>

        {saved && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Changes saved.
          </div>
        )}

        {/* Profile info */}
        <form
          action={updateProfile}
          encType="multipart/form-data"
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
        >
          <h2 className="font-semibold text-slate-800">Profile Information</h2>

          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-gold/40"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-xl font-bold text-gold">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Profile photo</label>
              <input
                name="photo"
                type="file"
                accept="image/*"
                className="mt-1 block text-sm text-slate-600"
              />
              <p className="mt-0.5 text-xs text-slate-400">JPG, PNG, or WEBP. Will be cropped to a circle.</p>
            </div>
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              defaultValue={profile.full_name}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {profile.email}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Email cannot be changed here. Contact an admin if needed.</p>
          </div>

          {profile.student_number && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Student ID</label>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700">
                {profile.student_number}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
          >
            Save changes
          </button>
        </form>

        {/* Change password */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Password</h2>
          <p className="mt-1 text-sm text-slate-500">
            To change your password, we'll send a reset link to <strong>{profile.email}</strong>.
          </p>
          <Link
            href="/login/reset"
            className="mt-4 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-gold hover:text-gold-dark"
          >
            Send password reset email
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
