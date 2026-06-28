import type { SupabaseClient } from "@supabase/supabase-js";

// Atomically issues the next number for a given counter key (e.g.
// "invoice_number_2026"), backed by the next_sequence_number() Postgres
// function — safe under concurrent calls, unlike counting existing rows.
export async function nextSequenceNumber(client: SupabaseClient, key: string): Promise<number> {
  const { data, error } = await client.rpc("next_sequence_number", { seq_key: key });
  if (error || data == null) {
    throw new Error(`Failed to generate sequence number for "${key}": ${error?.message ?? "no data returned"}`);
  }
  return data as number;
}
