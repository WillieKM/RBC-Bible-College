import type { ProgramLevel } from "@/lib/types";

// Shared by server and client code — keep this file free of server-only imports.

export const RESEARCH_BUCKET = "submissions";
export const RESEARCH_MAX_BYTES = 50 * 1024 * 1024; // Supabase's default per-file limit
export const RESEARCH_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const RESEARCH_KINDS = {
  proposal: "Proposal",
  chapter: "Chapter",
  draft: "Draft",
  final: "Final dissertation",
  other: "Other",
} as const;
export type ResearchKind = keyof typeof RESEARCH_KINDS;

export const RESEARCH_STATUSES = {
  submitted: "Submitted",
  received: "Received",
  needs_changes: "Needs changes",
  approved: "Approved",
} as const;
export type ResearchStatus = keyof typeof RESEARCH_STATUSES;

export const RESEARCH_STATUS_CLASS: Record<ResearchStatus, string> = {
  submitted: "bg-blue-100 text-blue-700",
  received: "bg-slate-100 text-slate-700",
  needs_changes: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
};

export interface ResearchSubmission {
  id: string;
  student_id: string;
  title: string;
  kind: ResearchKind;
  note: string | null;
  file_path: string;
  file_name: string;
  status: ResearchStatus;
  reviewer_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Only Master's and Doctorate scholars get the Research page.
export function isResearchLevel(level: ProgramLevel | string | null | undefined): boolean {
  return level === "masters" || level === "doctorate";
}
