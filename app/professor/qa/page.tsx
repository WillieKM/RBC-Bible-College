import { requireRole } from "@/lib/auth";
import { QaList } from "@/components/QaList";

export default async function ProfessorQaPage({ searchParams }: { searchParams: Promise<{ course?: string; error?: string }> }) {
  const profile = await requireRole(["professor"]);
  const { course, error } = await searchParams;
  return <QaList viewer={profile} portal="professor" courseFilter={course} error={error} />;
}
