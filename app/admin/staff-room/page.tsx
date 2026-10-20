import { requireRole } from "@/lib/auth";
import { StaffRoomBoard } from "@/components/StaffRoomBoard";

export default async function AdminStaffRoomPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await requireRole(["admin"]);
  const { error } = await searchParams;
  return <StaffRoomBoard viewer={profile} error={error} />;
}
