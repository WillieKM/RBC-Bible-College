import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewableStudentIds } from "@/lib/research-server";
import { ResearchReviewList, type ResearchRow } from "@/components/ResearchReviewList";

export default async function ProfessorResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ reviewed?: string }>;
}) {
  const profile = await requireRole(["professor"]);
  const { reviewed } = await searchParams;

  const studentIds = await reviewableStudentIds(profile.id);
  const { data } = studentIds.length
    ? await createAdminClient()
        .from("research_submissions")
        .select("*, profiles:student_id(full_name, student_number)")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Research</h1>
      <p className="mt-1 text-sm text-slate-500">
        Research proposals, theses, and dissertations from scholars in your courses and the programs you lead.
      </p>
      <ResearchReviewList rows={(data ?? []) as unknown as ResearchRow[]} reviewed={!!reviewed} />
    </div>
  );
}
