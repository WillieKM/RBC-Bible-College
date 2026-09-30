import { ApplyForm } from "@/components/ApplyForm";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; region?: string }>;
}) {
  const { error, notice, region } = await searchParams;
  const presetRegion = region === "usa" || region === "international" ? region : null;
  const regionLabel = presetRegion === "usa" ? "USA Campus" : presetRegion === "international" ? "Kenya / International" : null;

  // Server-side geo: block USA Campus for visitors outside the US
  const hdrs = await headers();
  const country = hdrs.get("x-vercel-ip-country");
  const usaBlocked = country !== null && country !== "US";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-ink-light p-8 shadow-xl border border-gold/20">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.jpg" alt="Revelation Bible College International" width={72} height={72} className="rounded-full" />
          <h1 className="mt-4 text-xl font-bold text-gold">Revelation Bible College International</h1>
          <p className="mt-1 text-sm text-slate-400">Diploma Application Form</p>
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

        <ApplyForm presetRegion={presetRegion} usaBlocked={usaBlocked} />

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/" className="text-gold hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
