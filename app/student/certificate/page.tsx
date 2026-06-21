import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PrintButton } from "@/components/PrintButton";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function StudentCertificatePage() {
  const profile = await requireRole(["student"]);

  if (!profile.completed_at) notFound();

  const supabase = await createClient();
  const { data: program } = profile.program_id
    ? await supabase.from("programs").select("name, program_level").eq("id", profile.program_id).single()
    : { data: null };

  const completedDate = new Date(profile.completed_at).toLocaleDateString("en-ZM", {
    year: "numeric", month: "long", day: "numeric",
  });

  const programLabel = program
    ? `${program.program_level === "degree" ? "Bachelor of Theology" : "Diploma in"} ${program.name}`
    : "Biblical Studies";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-slate-900">Your Certificate</h1>
        <PrintButton />
      </div>

      {/* Certificate — print-friendly */}
      <div className="mx-auto max-w-2xl rounded-2xl border-4 border-gold/40 bg-white p-10 shadow-lg print:border-[3px] print:shadow-none">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="RBC" width={80} height={80} className="rounded-full" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Revelation Bible College International
          </p>
          <div className="mt-4 h-px w-32 bg-gold/40" />
          <h2 className="mt-4 text-3xl font-bold text-slate-900 tracking-wide">Certificate of Completion</h2>
          <div className="mt-2 h-px w-32 bg-gold/40" />
        </div>

        {/* Body */}
        <div className="mt-8 text-center">
          <p className="text-base text-slate-600">This is to certify that</p>
          <p className="mt-3 text-3xl font-bold text-ink">{profile.full_name}</p>
          {profile.student_number && (
            <p className="mt-1 text-xs text-slate-400">Student No. {profile.student_number}</p>
          )}
          <p className="mt-5 text-base text-slate-600">
            has successfully completed all the requirements for the
          </p>
          <p className="mt-2 text-xl font-semibold text-gold-dark">{programLabel}</p>
          <p className="mt-5 text-sm text-slate-500">
            Awarded on <span className="font-semibold text-slate-700">{completedDate}</span>
          </p>
        </div>

        {/* Signature lines */}
        <div className="mt-12 flex justify-around">
          <div className="text-center">
            <div className="h-px w-36 bg-slate-300" />
            <p className="mt-1 text-xs text-slate-500">Director / Principal</p>
          </div>
          <div className="text-center">
            <div className="h-px w-36 bg-slate-300" />
            <p className="mt-1 text-xs text-slate-500">Date</p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-slate-400">
          Revelation Bible College International · www.rbci.org
        </p>
      </div>

    </div>
  );
}
