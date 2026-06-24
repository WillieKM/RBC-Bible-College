import type { createClient } from "@/lib/supabase/server";

// Submission file_url values are stored as a bucket-relative path so a fresh,
// short-lived signed URL can be minted on each view rather than persisting a
// single long-lived bearer link in the database. Older rows may still hold a
// full signed URL from before this change — those are returned as-is until
// they naturally expire.
export async function resolveSignedFileUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  value: string | null,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(value, expiresInSeconds);
  return data?.signedUrl ?? null;
}
