"use server";

import { headers } from "next/headers";

/**
 * Derives the site's base URL from the incoming request headers.
 *
 * This is more reliable than env vars because Vercel always sets `host` and
 * `x-forwarded-proto` correctly, regardless of how env vars are configured.
 * Falls back to env vars for non-Vercel environments.
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
