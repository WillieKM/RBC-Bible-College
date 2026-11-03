"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { isQaModerator, qaBase, taggableCourses, type QaPortal } from "@/lib/qa";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Which portal the form was posted from (dual-access users can use either).
function portalFrom(formData: FormData): QaPortal {
  return formData.get("portal") === "professor" ? "professor" : "student";
}

async function requireMember(portal: QaPortal) {
  return requireRole([portal]);
}

function revalidateQa(questionId?: string) {
  for (const portal of ["student", "professor"] as const) {
    revalidatePath(qaBase(portal));
    if (questionId) revalidatePath(`${qaBase(portal)}/${questionId}`);
  }
}

export async function askQuestion(formData: FormData) {
  const portal = portalFrom(formData);
  const profile = await requireMember(portal);
  const base = qaBase(portal);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) redirect(`${base}?error=${encodeURIComponent("Please add a title and your question.")}`);

  // Only courses this user belongs to can be tagged.
  const requestedCourse = String(formData.get("course_id") || "");
  const allowed = await taggableCourses(profile, portal);
  const courseId = allowed.some((c) => c.id === requestedCourse) ? requestedCourse : null;

  const admin = createAdminClient();
  const { data: question, error } = await admin
    .from("qa_questions")
    .insert({ author_id: profile.id, course_id: courseId, title, body })
    .select("id")
    .single();
  if (error || !question) {
    console.error("[askQuestion] insert failed:", error);
    redirect(`${base}?error=${encodeURIComponent(`Could not post your question: ${error?.message ?? "unknown error"}`)}`);
  }

  // A scholar's question tagged with a course goes to that course's lecturer.
  if (courseId) {
    const { data: course } = await admin.from("courses").select("professor_id, title").eq("id", courseId).maybeSingle();
    if (course?.professor_id && course.professor_id !== profile.id) {
      await admin.from("notifications").insert({
        user_id: course.professor_id,
        title: `New question in ${course.title}`,
        body: `${profile.full_name} asked: ${title}`,
        link: `${qaBase("professor")}/${question.id}`,
      });
    }
  }

  revalidateQa();
  redirect(`${base}/${question.id}`);
}

export async function answerQuestion(formData: FormData) {
  const portal = portalFrom(formData);
  const profile = await requireMember(portal);
  const base = qaBase(portal);
  const questionId = String(formData.get("question_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!questionId) redirect(base);
  if (!body) redirect(`${base}/${questionId}?error=${encodeURIComponent("Your answer is empty.")}`);

  const admin = createAdminClient();
  const { data: question } = await admin
    .from("qa_questions")
    .select("id, title, author_id")
    .eq("id", questionId)
    .maybeSingle();
  if (!question) redirect(base);

  const { error } = await admin.from("qa_answers").insert({ question_id: questionId, author_id: profile.id, body });
  if (error) {
    console.error("[answerQuestion] insert failed:", error);
    redirect(`${base}/${questionId}?error=${encodeURIComponent(`Could not post your answer: ${error.message}`)}`);
  }

  // Tell whoever asked, in the portal they'd normally use.
  if (question.author_id && question.author_id !== profile.id) {
    const { data: asker } = await admin.from("profiles").select("role").eq("id", question.author_id).maybeSingle();
    const askerPortal: QaPortal = asker?.role === "student" ? "student" : "professor";
    await admin.from("notifications").insert({
      user_id: question.author_id,
      title: `New answer: ${question.title}`,
      body: `${profile.full_name} answered your question.`,
      link: `${qaBase(askerPortal)}/${questionId}`,
    });
  }

  revalidateQa(questionId);
  redirect(`${base}/${questionId}#answers`);
}

export async function markBestAnswer(formData: FormData) {
  const portal = portalFrom(formData);
  const profile = await requireMember(portal);
  const base = qaBase(portal);
  const questionId = String(formData.get("question_id") || "");
  const answerId = String(formData.get("answer_id") || "");
  if (!isQaModerator(profile)) redirect(`${base}/${questionId}`);

  const admin = createAdminClient();
  const { data: question } = await admin
    .from("qa_questions")
    .select("best_answer_id")
    .eq("id", questionId)
    .maybeSingle();
  const { data: answer } = await admin
    .from("qa_answers")
    .select("id, author_id")
    .eq("id", answerId)
    .eq("question_id", questionId)
    .maybeSingle();
  if (question && answer) {
    // Clicking the current best answer again un-marks it.
    const next = question.best_answer_id === answerId ? null : answerId;
    await admin.from("qa_questions").update({ best_answer_id: next }).eq("id", questionId);
    if (next && answer.author_id && answer.author_id !== profile.id) {
      const { data: author } = await admin.from("profiles").select("role").eq("id", answer.author_id).maybeSingle();
      await admin.from("notifications").insert({
        user_id: answer.author_id,
        title: "Your answer was marked best ✓",
        body: `${profile.full_name} marked your answer as the best answer.`,
        link: `${qaBase(author?.role === "student" ? "student" : "professor")}/${questionId}`,
      });
    }
  }

  revalidateQa(questionId);
  redirect(`${base}/${questionId}#answers`);
}

export async function deleteQuestion(formData: FormData) {
  const portal = portalFrom(formData);
  const profile = await requireMember(portal);
  const base = qaBase(portal);
  const id = String(formData.get("id") || "");

  const admin = createAdminClient();
  const { data: question } = await admin.from("qa_questions").select("author_id").eq("id", id).maybeSingle();
  if (question && (question.author_id === profile.id || isQaModerator(profile))) {
    await admin.from("qa_questions").delete().eq("id", id); // answers cascade
  }

  revalidateQa(id);
  redirect(base);
}

export async function deleteAnswer(formData: FormData) {
  const portal = portalFrom(formData);
  const profile = await requireMember(portal);
  const base = qaBase(portal);
  const id = String(formData.get("id") || "");
  const questionId = String(formData.get("question_id") || "");

  const admin = createAdminClient();
  const { data: answer } = await admin.from("qa_answers").select("author_id").eq("id", id).maybeSingle();
  if (answer && (answer.author_id === profile.id || isQaModerator(profile))) {
    await admin.from("qa_answers").delete().eq("id", id); // best_answer_id resets via FK
  }

  revalidateQa(questionId);
  redirect(`${base}/${questionId}#answers`);
}
