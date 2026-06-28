import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditLog, ErrorLog } from "@/lib/types";

const ACTION_COLORS: Record<string, string> = {
  approve_application: "bg-green-100 text-green-700",
  reject_application: "bg-red-100 text-red-700",
  grade_submission: "bg-blue-100 text-blue-700",
  send_invoice: "bg-purple-100 text-purple-700",
  mark_complete: "bg-gold/20 text-gold-dark",
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const admin = createAdminClient();
  const [{ data: logs, count }, { data: errors, count: errorCount }] = await Promise.all([
    admin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1),
    admin
      .from("error_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  function timeStr(d: string) {
    return new Date(d).toLocaleString("en-ZM", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
      <p className="mt-1 text-sm text-slate-500">
        {(count ?? 0).toLocaleString()} events recorded · Page {page} of {totalPages || 1}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Time</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Actor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Action</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Target</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Details</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No audit events yet.</td>
              </tr>
            )}
            {(logs ?? []).map((log: AuditLog) => (
              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{timeStr(log.created_at)}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{log.actor_name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {log.target_type && <span className="font-medium">{log.target_type}</span>}
                  {log.target_id && <span className="ml-1 text-slate-400">#{log.target_id.slice(0, 8)}</span>}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-slate-500">
                  {log.details && (
                    <span className="line-clamp-2">
                      {Object.entries(log.details as Record<string, unknown>)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              ← Previous
            </a>
          )}
          <span className="text-sm text-slate-500">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Next →
            </a>
          )}
        </div>
      )}

      {/* Error log */}
      <h2 className="mt-10 text-xl font-bold text-slate-900">System Errors</h2>
      <p className="mt-1 text-sm text-slate-500">
        {(errorCount ?? 0).toLocaleString()} uncaught server error{(errorCount ?? 0) === 1 ? "" : "s"} recorded · showing most recent 20
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Time</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Message</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Route</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Request</th>
            </tr>
          </thead>
          <tbody>
            {(errors ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No errors recorded — good sign.</td>
              </tr>
            )}
            {(errors ?? []).map((err: ErrorLog) => (
              <tr key={err.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{timeStr(err.created_at)}</td>
                <td className="max-w-sm px-4 py-3 text-xs text-red-700">
                  <span className="line-clamp-2">{err.message}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {err.route_path && <span className="font-medium">{err.route_path}</span>}
                  {err.route_type && <span className="ml-1 text-slate-400">({err.route_type})</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {err.request_method} {err.request_path}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
