"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { STAFF_FILES_BUCKET, STAFF_FILE_MAX_BYTES, STAFF_MAX_FILES, staffFileType } from "@/lib/staff-room";

// requireRole(["professor"]) admits professors, dual-access professors, and admins.
async function requireStaff() {
  return requireRole(["professor"]);
}

function staffRoomPath(role: string) {
  return role === "admin" ? "/admin/staff-room" : "/professor/staff-room";
}

// Step 1 of attaching a file: a one-time signed URL so the browser uploads
// straight to Storage (files can exceed Vercel's 4.5MB request limit).
export async function createStaffUpload(input: {
  fileName: string;
  size: number;
}): Promise<{ ok: true; path: string; token: string; contentType: string } | { ok: false; error: string }> {
  const profile = await requireStaff();
  const contentType = staffFileType(input.fileName);
  if (!contentType) return { ok: false, error: `"${input.fileName}" isn't a supported file type.` };
  if (input.size > STAFF_FILE_MAX_BYTES) return { ok: false, error: `"${input.fileName}" is larger than 50MB.` };

  const safeName = input.fileName.replace(/[^\w.\-]+/g, "_").slice(-120);
  const path = `staff-room/${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { data, error } = await createAdminClient().storage.from(STAFF_FILES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Could not start the upload. Please try again." };
  return { ok: true, path: data.path, token: data.token, contentType };
}

// Attachments arrive as parallel "attachment_path"/"attachment_name" fields;
// only paths this user was issued (staff-room/<their id>/...) are accepted.
function attachmentsFrom(formData: FormData, uploaderId: string) {
  const paths = formData.getAll("attachment_path").map(String);
  const names = formData.getAll("attachment_name").map(String);
  return paths
    .map((path, i) => ({ file_path: path, file_name: names[i] || path.split("/").pop() || "file" }))
    .filter((a) => a.file_path.startsWith(`staff-room/${uploaderId}/`))
    .slice(0, STAFF_MAX_FILES);
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

  const files = attachmentsFrom(formData, profile.id);
  if (files.length > 0) {
    const { error: attachError } = await admin
      .from("staff_room_attachments")
      .insert(files.map((f) => ({ ...f, post_id: postId })));
    if (attachError) console.error("[createStaffPost] attachments insert failed:", attachError);
  }

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

  const { data: reply, error } = await admin
    .from("staff_room_posts")
    .insert({ author_id: profile.id, parent_id: parentId, body })
    .select("id")
    .single();
  if (error || !reply) {
    console.error("[replyStaffPost] insert failed:", error);
    redirect(`${back}?error=${encodeURIComponent(`Could not reply: ${error?.message ?? "unknown error"}`)}`);
  }

  const files = attachmentsFrom(formData, profile.id);
  if (files.length > 0) {
    const { error: attachError } = await admin
      .from("staff_room_attachments")
      .insert(files.map((f) => ({ ...f, post_id: reply.id })));
    if (attachError) console.error("[replyStaffPost] attachments insert failed:", attachError);
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
    // Collect files on the post and its replies before the rows cascade away.
    const { data: replies } = await admin.from("staff_room_posts").select("id").eq("parent_id", id);
    const postIds = [id, ...(replies ?? []).map((r) => r.id)];
    const { data: files } = await admin.from("staff_room_attachments").select("file_path").in("post_id", postIds);
    if (files?.length) await admin.storage.from(STAFF_FILES_BUCKET).remove(files.map((f) => f.file_path));

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
