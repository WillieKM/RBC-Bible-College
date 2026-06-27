import { ApplyDegreeForm } from "@/components/ApplyDegreeForm";
import Link from "next/link";
import Image from "next/image";

export default async function ApplyDegreePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; region?: string }>;
}) {
  const { error, notice, region } = await searchParams;
  const presetRegion = region === "usa" || region === "international" ? region : null;
  const regionLabel = presetRegion === "usa" ? "USA Campus" : presetRegion === "international" ? "Kenya / International" : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/tbcs-logo.png"
            alt="Tabernacle Bible College and Seminary"
            width={320}
            height={106}
            className="h-auto w-full max-w-[280px] rounded-lg"
          />
          <h1 className="mt-4 text-2xl font-bold text-gold">Bachelor&apos;s, Master&apos;s &amp; Doctorate Application Form</h1>
          <p className="mt-1 text-sm text-slate-400">
            Offered in partnership with Tabernacle Bible College and Seminary
          </p>
          {regionLabel && (
            <span className="mt-2 rounded-full border border-gold/40 px-3 py-0.5 text-xs font-semibold text-gold">
              {regionLabel}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {notice && (
          <div className="mt-4 rounded-lg bg-blue-950 border border-blue-800 px-3 py-2 text-sm text-blue-200">
            {notice}
          </div>
        )}

        <ApplyDegreeForm presetRegion={presetRegion} />

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/" className="text-gold hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
