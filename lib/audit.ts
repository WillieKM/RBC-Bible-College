import { createAdminClient } from "@/lib/supabase/admin";

export async function writeAuditLog(opts: {
  actorId: string | null;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  try {
    await admin.from("audit_logs").insert({
      actor_id: opts.actorId,
      actor_name: opts.actorName,
      action: opts.action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      details: opts.details ?? null,
    });
  } catch {
    // never throw — audit failures shouldn't break flows
  }
}
