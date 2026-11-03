import { requireRole } from "@/lib/auth";
import { StaffRoomBoard } from "@/components/StaffRoomBoard";
import { isLecturer } from "@/lib/staff-room";
import { notFound } from "next/navigation";

export default async function ProfessorStaffRoomPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await requireRole(["professor"]);
  // Lecturers only: requireRole admits admins, who are excluded at the lecturers' request.
  if (!isLecturer(profile)) notFound();
  const { error } = await searchParams;
  return <StaffRoomBoard viewer={profile} error={error} />;
}
