import { requireRole } from "@/lib/auth";
import { StaffRoomBoard } from "@/components/StaffRoomBoard";

export default async function ProfessorStaffRoomPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await requireRole(["professor"]);
  const { error } = await searchParams;
  return <StaffRoomBoard viewer={profile} error={error} />;
}
