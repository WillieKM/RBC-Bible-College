import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Only use in trusted server-side code
// (Server Actions / route handlers) for admin operations like inviting users.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
