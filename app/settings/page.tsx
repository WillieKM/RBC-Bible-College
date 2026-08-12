import { getCurrentProfile } from "@/lib/auth";
import { updateProfile, updatePassword, updatePersonalDetails } from "@/lib/actions/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { PasswordField } from "@/components/PasswordField";
import { redirect } from "next/navigation";
import { getNavGroups } from "@/lib/portal-nav";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; pw_saved?: string; error?: string; details_saved?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { saved, pw_saved, error, details_saved } = await searchParams;

  return (
    <DashboardShell
      profile={profile}
      groups={getNavGroups(profile)}
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

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              placeholder="+254 700 000 000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
            <textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={profile.address ?? ""}
              placeholder="Street, city, country"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
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

        {/* Personal details — students only */}
        {profile.role === "student" && (
          <form
            action={updatePersonalDetails}
            className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
          >
            <div>
              <h2 className="font-semibold text-slate-800">Personal Details</h2>
              <p className="mt-1 text-sm text-slate-500">Complete your student record. This information is kept on file by the administration.</p>
            </div>

            {details_saved && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                Details saved.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-700">Date of birth</label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  defaultValue={profile.date_of_birth ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 [color-scheme:light]"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-slate-700">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  defaultValue={profile.gender ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-slate-700">Nationality</label>
                <input
                  id="nationality"
                  name="nationality"
                  type="text"
                  defaultValue={profile.nationality ?? ""}
                  placeholder="e.g. Kenyan"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
              </div>

              <div>
                <label htmlFor="city_of_residence" className="block text-sm font-medium text-slate-700">City of residence</label>
                <input
                  id="city_of_residence"
                  name="city_of_residence"
                  type="text"
                  defaultValue={profile.city_of_residence ?? ""}
                  placeholder="e.g. Nairobi"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-slate-700">Occupation</label>
                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  defaultValue={profile.occupation ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
              </div>

              <div>
                <label htmlFor="marital_status" className="block text-sm font-medium text-slate-700">Marital status</label>
                <select
                  id="marital_status"
                  name="marital_status"
                  defaultValue={profile.marital_status ?? ""}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="highest_education" className="block text-sm font-medium text-slate-700">Highest level of education</label>
              <select
                id="highest_education"
                name="highest_education"
                defaultValue={profile.highest_education ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <option value="">Select</option>
                <option value="PHD">PHD</option>
                <option value="Masters">Masters</option>
                <option value="Degree">Degree</option>
                <option value="Diploma">Diploma</option>
                <option value="Certificate">Certificate</option>
                <option value="Basic Education">Basic Education</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label htmlFor="statement" className="block text-sm font-medium text-slate-700">Life experience / personal statement</label>
              <textarea
                id="statement"
                name="statement"
                rows={4}
                defaultValue={profile.statement ?? ""}
                placeholder="Share your background, ministry experience, or reason for joining..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
            >
              Save details
            </button>
          </form>
        )}

        {/* Change password */}
        <form
          action={updatePassword}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <div>
            <h2 className="font-semibold text-slate-800">Change Password</h2>
            <p className="mt-1 text-sm text-slate-500">You're already signed in — no email needed.</p>
          </div>

          {pw_saved && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Password updated successfully.
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <PasswordField />

          <button
            type="submit"
            className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
          >
            Update password
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
