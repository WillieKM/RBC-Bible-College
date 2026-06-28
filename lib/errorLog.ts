import { createAdminClient } from "@/lib/supabase/admin";

export async function writeErrorLog(opts: {
  message: string;
  digest?: string;
  routePath?: string;
  routeType?: string;
  requestPath?: string;
  requestMethod?: string;
}) {
  const admin = createAdminClient();
  try {
    await admin.from("error_logs").insert({
      message: opts.message,
      digest: opts.digest ?? null,
      route_path: opts.routePath ?? null,
      route_type: opts.routeType ?? null,
      request_path: opts.requestPath ?? null,
      request_method: opts.requestMethod ?? null,
    });
  } catch {
    // never throw — logging failures shouldn't compound the original error
  }
}
