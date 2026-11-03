import { requireRole } from "@/lib/auth";
import { QaThread } from "@/components/QaThread";

export default async function StudentQaThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireRole(["student"]);
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  return <QaThread viewer={profile} portal="student" questionId={id} error={error} />;
}
