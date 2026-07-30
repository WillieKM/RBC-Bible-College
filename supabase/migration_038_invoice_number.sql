-- Add invoice_number column to invoices table (e.g. INV-2026-0001)
-- Generated atomically via next_sequence_number() in lib/sequences.ts
alter table invoices add column if not exists invoice_number text;
