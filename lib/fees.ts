import type { ProgramLevel } from "@/lib/types";

// Standard tuition schedule by program tier and campus/region. Programs can
// still get a manual fee override on the admin Programs page — this is only
// the fallback used when no override is set (see reviewApplication).
export const FEE_SCHEDULE: Record<ProgramLevel, { usa: number; international: number }> = {
  diploma:   { usa: 1750,  international: 60000  },
  bachelors: { usa: 2000,  international: 120000 },
  masters:   { usa: 2300,  international: 150000 },
  doctorate: { usa: 2750,  international: 175000 },
};

export const ENROLLMENT_FEES: Record<ProgramLevel, { usa: number; international: number }> = {
  diploma:   { usa: 100, international: 1000  },
  bachelors: { usa: 250, international: 10000 },
  masters:   { usa: 300, international: 20000 },
  doctorate: { usa: 400, international: 30000 },
};

// Maps each TBCS degree program name (as offered on the apply/degree form)
// to its fee tier. RBC's own programs (Certificate, Diploma) are always
// "diploma" — see submitApplication.
export const DEGREE_PROGRAM_LEVELS: Record<string, ProgramLevel> = {
  "Bachelor of Theology (B.Th.)": "bachelors",
  "Master of Theology (M.Th.)": "masters",
  "Doctor of Divinity (D.Div.)": "doctorate",
};

export const PROGRAM_LEVEL_LABELS: Record<ProgramLevel, string> = {
  diploma: "Diploma / Certificate",
  bachelors: "Bachelor's",
  masters: "Master's",
  doctorate: "Doctorate",
};

export function feeForLevel(level: ProgramLevel, region: "usa" | "international"): number {
  return FEE_SCHEDULE[level][region];
}

export function formatFee(amount: number, region: "usa" | "international"): string {
  return region === "usa" ? `$${amount.toLocaleString()}` : `KSh ${amount.toLocaleString()}`;
}
