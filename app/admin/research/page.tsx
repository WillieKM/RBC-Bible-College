import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResearchReviewList, type ResearchRow } from "@/components/ResearchReviewList";

export default async function AdminResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ reviewed?: string }>;
}) {
  await requireRole(["admin"]);
  const { reviewed } = await searchParams;

  const { data } = await createAdminClient()
    .from("research_submissions")
    .select("*, profiles:student_id(full_name, student_number)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Research</h1>
      <p className="mt-1 text-sm text-slate-500">All research proposals, theses, and dissertations from Bachelor&apos;s, Master&apos;s, and Doctorate scholars.</p>
      <ResearchReviewList rows={(data ?? []) as unknown as ResearchRow[]} reviewed={!!reviewed} />
    </div>
  );
}
