import { requireRole } from "@/lib/auth";
import { QaThread } from "@/components/QaThread";

export default async function ProfessorQaThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireRole(["professor"]);
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  return <QaThread viewer={profile} portal="professor" questionId={id} error={error} />;
}
