"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

// requireRole(["professor"]) admits professors, dual-access professors, and admins.
async function requireStaff() {
  return requireRole(["professor"]);
}

function staffRoomPath(role: string) {
  return role === "admin" ? "/admin/staff-room" : "/professor/staff-room";
}

function revalidateStaffRoom() {
  revalidatePath("/admin/staff-room");
  revalidatePath("/professor/staff-room");
}

export async function createStaffPost(formData: FormData) {
  const profile = await requireStaff();
  const back = staffRoomPath(profile.role);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) redirect(`${back}?error=${encodeURIComponent("A post needs a title and a message.")}`);

  const admin = createAdminClient();
  const { data: post, error } = await admin
    .from("staff_room_posts")
    .insert({ author_id: profile.id, title, body })
    .select("id")
    .single();
  if (error || !post) {
    console.error("[createStaffPost] insert failed:", error);
    redirect(`${back}?error=${encodeURIComponent(`Could not post: ${error?.message ?? "unknown error"}`)}`);
  }

  const postId: string = post.id;

  // Bell notification for every other staff member, after the response.
  const notifyStaff = async () => {
    const { data: staff } = await admin
      .from("profiles")
      .select("id, role")
      .or("role.eq.admin,role.eq.professor,secondary_role.eq.professor")
      .neq("id", profile.id);
    if (!staff?.length) return;
    await admin.from("notifications").insert(
      staff.map((s) => ({
        user_id: s.id,
        title: `Staff Room: ${title}`,
        body: `${profile.full_name} posted a new topic.`,
        link: `${staffRoomPath(s.role)}#post-${postId}`,
      }))
    );
  };
  try {
    after(notifyStaff);
  } catch {
    void notifyStaff();
  }

  revalidateStaffRoom();
  redirect(`${back}#post-${postId}`);
}

export async function replyStaffPost(formData: FormData) {
  const profile = await requireStaff();
  const back = staffRoomPath(profile.role);
  const parentId = String(formData.get("parent_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!parentId || !body) redirect(back);

  const admin = createAdminClient();
  // Replies attach to top-level posts only.
  const { data: parent } = await admin
    .from("staff_room_posts")
    .select("id, author_id, title, parent_id")
    .eq("id", parentId)
    .maybeSingle();
  if (!parent || parent.parent_id) redirect(back);

  const { error } = await admin.from("staff_room_posts").insert({ author_id: profile.id, parent_id: parentId, body });
  if (error) {
    console.error("[replyStaffPost] insert failed:", error);
    redirect(`${back}?error=${encodeURIComponent(`Could not reply: ${error.message}`)}`);
  }

  // Let the topic's author know, unless they're replying to themselves.
  if (parent.author_id && parent.author_id !== profile.id) {
    const { data: author } = await admin.from("profiles").select("role").eq("id", parent.author_id).maybeSingle();
    await admin.from("notifications").insert({
      user_id: parent.author_id,
      title: `Reply in Staff Room: ${parent.title ?? "your post"}`,
      body: `${profile.full_name} replied.`,
      link: `${staffRoomPath(author?.role ?? "professor")}#post-${parentId}`,
    });
  }

  revalidateStaffRoom();
  redirect(`${back}#post-${parentId}`);
}

export async function deleteStaffPost(formData: FormData) {
  const profile = await requireStaff();
  const back = staffRoomPath(profile.role);
  const id = String(formData.get("id") || "");
  if (!id) redirect(back);

  const admin = createAdminClient();
  const { data: post } = await admin.from("staff_room_posts").select("author_id").eq("id", id).maybeSingle();
  // Authors delete their own posts; admins can delete any. Replies cascade.
  if (post && (post.author_id === profile.id || profile.role === "admin")) {
    await admin.from("staff_room_posts").delete().eq("id", id);
  }

  revalidateStaffRoom();
  redirect(back);
}

export async function togglePinStaffPost(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") || "");
  const pinned = formData.get("pinned") === "true";
  if (id) {
    await createAdminClient().from("staff_room_posts").update({ pinned: !pinned }).eq("id", id).is("parent_id", null);
  }
  revalidateStaffRoom();
  redirect("/admin/staff-room");
}
