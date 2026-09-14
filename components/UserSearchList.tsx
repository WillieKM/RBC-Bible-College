"use client";

import { useState } from "react";
import { updateUserRole, updateFinanceAccess, updateStudentProgram, updateUserProfile, resendInvite, revokeAccess, restoreAccess, deleteUser } from "@/lib/actions/admin";
import { DeleteButton } from "@/components/DeleteButton";
import { TypeToConfirmButton } from "@/components/TypeToConfirmButton";
import type { Profile, Program } from "@/lib/types";

export function UserSearchList({
  profiles,
  programs,
  viewerFinanceAccess,
  viewerId,
  lastSignInById = {},
}: {
  profiles: Profile[];
  programs: Program[];
  viewerFinanceAccess: boolean;
  viewerId: string;
  lastSignInById?: Record<string, string | null>;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? profiles.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.full_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.role?.toLowerCase().includes(q) ||
          p.student_number?.toLowerCase().includes(q)
        );
      })
    : profiles;

  return (
    <>
      <div className="mt-4">
        <input
          type="search"
          placeholder="Search by name, email, role, or student ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        {query.trim() && (
          <p className="mt-1.5 text-xs text-slate-500">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className={`rounded-lg border ${p.banned ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
            {/* Main row */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{p.full_name}</p>
                  {p.banned && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Access revoked</span>}
                  {!lastSignInById[p.id] && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Never logged in</span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{p.email}</p>
                {p.student_number && <p className="text-xs text-slate-400">ID: {p.student_number}</p>}
                {lastSignInById[p.id] && (
                  <p className="text-xs text-slate-400">
                    Last login: {new Date(lastSignInById[p.id]!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={resendInvite}>
                  <input type="hidden" name="email" value={p.email} />
                  <DeleteButton label="Resend invite" pendingLabel="Sending…" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50" />
                </form>
                {p.role !== "admin" && (
                  p.banned ? (
                    <form action={restoreAccess}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton label="Restore access" pendingLabel="Restoring…" className="rounded-lg border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50" />
                    </form>
                  ) : (
                    <form action={revokeAccess}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton label="Revoke access" pendingLabel="Revoking…" className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50" />
                    </form>
                  )
                )}
                {viewerFinanceAccess && p.id !== viewerId && p.role !== "admin" && (
                  <TypeToConfirmButton
                    formAction={deleteUser}
                    hiddenFields={{ id: p.id }}
                    userName={p.full_name}
                  />
                )}
                <form action={updateUserRole} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <select name="role" defaultValue={p.role} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                    <option value="admin">Admin</option>
                    <option value="professor">Professor</option>
                    <option value="student">Student</option>
                  </select>
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Save
                  </button>
                </form>
                {p.role === "admin" && viewerFinanceAccess && (
                  <form action={updateFinanceAccess} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="finance_access" value={p.finance_access ? "0" : "1"} />
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      {p.finance_access ? "Revoke finance access" : "Grant finance access"}
                    </button>
                  </form>
                )}
                {p.role === "student" && viewerFinanceAccess && (
                  <form action={updateStudentProgram} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <select name="program_id" defaultValue={p.program_id ?? ""} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                      <option value="">No program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                      ))}
                    </select>
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      Save
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Edit name / email row — main admin only */}
            {viewerFinanceAccess && (
              <form action={updateUserProfile} className="flex flex-wrap items-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                <input type="hidden" name="id" value={p.id} />
                <div>
                  <label className="block text-xs font-medium text-slate-500">Full name</label>
                  <input
                    name="full_name"
                    defaultValue={p.full_name}
                    required
                    className="mt-0.5 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={p.email}
                    required
                    className="mt-0.5 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <DeleteButton
                  label="Update"
                  pendingLabel="Saving…"
                  className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                />
              </form>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500">
            {query.trim() ? `No users match "${query}".` : "No users yet."}
          </p>
        )}
      </div>
    </>
  );
}
