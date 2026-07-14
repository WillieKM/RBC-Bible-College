"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { inviteUser } from "@/lib/actions/admin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
    >
      {pending ? "Inviting…" : "Invite User"}
    </button>
  );
}

export function InviteUserForm({ programs }: { programs: { id: string; name: string }[] }) {
  const [role, setRole] = useState("professor");

  return (
    <form action={inviteUser} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">Full name</label>
        <input name="full_name" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Role</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="professor">Professor</option>
          <option value="student">Student</option>
        </select>
      </div>
      {role === "student" && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700">Program</label>
            <select name="program_id" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">— select program —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Campus / Region</label>
            <select name="region" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="international">Kenya / International</option>
              <option value="usa">USA Campus</option>
            </select>
          </div>
        </>
      )}
      <SubmitButton />
    </form>
  );
}
