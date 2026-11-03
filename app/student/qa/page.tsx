import { requireRole } from "@/lib/auth";
import { QaList } from "@/components/QaList";

export default async function StudentQaPage({ searchParams }: { searchParams: Promise<{ course?: string; error?: string }> }) {
  const profile = await requireRole(["student"]);
  const { course, error } = await searchParams;
  return <QaList viewer={profile} portal="student" courseFilter={course} error={error} />;
}
