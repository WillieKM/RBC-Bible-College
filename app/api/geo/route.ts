import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Returns the visitor's country code using Vercel's built-in IP geolocation header.
// Falls back to null when running locally (no header present).
export function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country") ?? null;
  return NextResponse.json({ country });
}
