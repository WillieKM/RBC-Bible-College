import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PrintButton } from "@/components/PrintButton";
import type { Program } from "@/lib/types";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "Revelation Bible College International";

export default async function StudentIdCardPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: program } = profile.program_id
    ? await supabase.from("programs").select("name, program_level").eq("id", profile.program_id).single()
    : { data: null };

  const prog = program as Pick<Program, "name" | "program_level"> | null;
  const enrolledYear = new Date(profile.created_at).getFullYear();
  const expiryYear = enrolledYear + 4;

  return (
    <div>
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student ID Card</h1>
          <p className="mt-1 text-sm text-slate-500">Print or save your student identification card.</p>
        </div>
        <PrintButton />
      </div>

      {/* Card — centred, fixed size for print */}
      <div className="mt-8 flex justify-center print:mt-0">
        <div
          className="relative w-[340px] overflow-hidden rounded-2xl shadow-2xl print:shadow-none"
          style={{ background: "linear-gradient(135deg, #14110c 0%, #2a2318 60%, #14110c 100%)" }}
        >
          {/* Gold accent bar */}
          <div className="h-1.5 w-full" style={{ background: "#d4af37" }} />

          {/* Header */}
          <div className="px-6 pt-5 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {SCHOOL_NAME}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-widest text-slate-400">
              Student Identification Card
            </p>
          </div>

          {/* Body */}
          <div className="flex items-start gap-4 px-6 pb-5">
            {/* Photo */}
            <div className="shrink-0">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-24 w-20 rounded-lg object-cover ring-2 ring-amber-400/50"
                />
              ) : (
                <div className="flex h-24 w-20 items-center justify-center rounded-lg bg-amber-400/10 ring-2 ring-amber-400/30">
                  <span className="text-3xl font-bold text-amber-400">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2.5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Name</p>
                <p className="text-sm font-bold leading-tight text-white">{profile.full_name}</p>
              </div>
              {profile.student_number && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Student ID</p>
                  <p className="font-mono text-sm font-bold text-amber-400">{profile.student_number}</p>
                </div>
              )}
              {prog && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Program</p>
                  <p className="text-xs font-semibold leading-tight text-slate-200">{prog.name}</p>
                </div>
              )}
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Valid</p>
                <p className="text-xs text-slate-300">{enrolledYear} – {expiryYear}</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between bg-black/30 px-6 py-2">
            <p className="text-[9px] uppercase tracking-widest text-slate-500">
              {profile.region === "usa" ? "USA" : "International"}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-slate-500">
              {profile.completed_at ? "Alumni" : "Active Student"}
            </p>
          </div>

          {/* Bottom gold bar */}
          <div className="h-1" style={{ background: "#d4af37" }} />
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400 print:hidden">
        This card is for identification purposes within the college. It is not a government-issued ID.
      </p>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #__next > * { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print\\:mt-0 { margin-top: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
