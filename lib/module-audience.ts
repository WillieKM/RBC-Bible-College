// Who a module file is for, stored in module_files.send_audience:
//   "all"                → every student
//   "diploma" | "bachelors" | "masters" | "doctorate" → every program at that level
//   "program:<uuid>"     → one specific program
//   "prof:<uuid>"        → one professor (no students)
//   null                 → legacy uploads made before an audience was required; treated as "all"

export const LEVEL_AUDIENCES = ["diploma", "bachelors", "masters", "doctorate"] as const;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PROGRAM_RE = new RegExp(`^program:${UUID}$`, "i");
const PROF_RE = new RegExp(`^prof:${UUID}$`, "i");

export function isValidAudience(audience: string): boolean {
  return (
    audience === "all" ||
    (LEVEL_AUDIENCES as readonly string[]).includes(audience) ||
    PROGRAM_RE.test(audience) ||
    PROF_RE.test(audience)
  );
}

export function audienceProgramId(audience: string | null): string | null {
  return audience && PROGRAM_RE.test(audience) ? audience.slice("program:".length) : null;
}

export function studentCanSeeModule(
  audience: string | null,
  programLevel: string | null,
  programId: string | null
): boolean {
  if (!audience || audience === "all") return true;
  if (programLevel && audience === programLevel) return true;
  return !!programId && audience === `program:${programId}`;
}

// PostgREST .or() filter matching studentCanSeeModule.
export function studentAudienceFilter(programLevel: string | null, programId: string | null): string {
  const parts = ["send_audience.eq.all", "send_audience.is.null"];
  if (programLevel) parts.push(`send_audience.eq.${programLevel}`);
  if (programId) parts.push(`send_audience.eq.program:${programId}`);
  return parts.join(",");
}
