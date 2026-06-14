import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Pings Supabase so the free-tier project doesn't auto-pause from inactivity.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  await admin.from("profiles").select("id").limit(1);

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
