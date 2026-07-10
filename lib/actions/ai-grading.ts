"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function fetchGoogleDocsText(url: string): Promise<string | null> {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  try {
    const res = await fetch(
      `https://docs.google.com/document/d/${match[1]}/export?format=txt`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const text = await res.text();
    return text.trim() || null;
  } catch {
    return null;
  }
}

export async function gradeWithAI(formData: FormData) {
  await requireRole(["professor"]);
  const supabase = await createClient();

  const submissionId = String(formData.get("submission_id") || "");
  const assignmentId = String(formData.get("assignment_id") || "");

  const { data: submission } = await supabase
    .from("submissions")
    .select("content, file_url, assignments(title, description, points_possible)")
    .eq("id", submissionId)
    .single();

  // Try to get text content: from the text field, or by fetching a Google Docs link
  let textContent = submission?.content ?? null;

  if (!textContent && submission?.file_url?.startsWith("http")) {
    if (submission.file_url.includes("docs.google.com/document")) {
      textContent = await fetchGoogleDocsText(submission.file_url);
      if (!textContent) {
        redirect(
          `/professor/assignments/${assignmentId}?ai_error=Could+not+read+the+Google+Doc+%E2%80%94+make+sure+sharing+is+set+to+%22Anyone+with+the+link%22`
        );
      }
    } else {
      redirect(
        `/professor/assignments/${assignmentId}?ai_error=AI+can+only+read+Google+Docs+links+automatically.+Ask+the+student+to+also+paste+their+response+as+text.`
      );
    }
  }

  if (!textContent || !submission) {
    redirect(`/professor/assignments/${assignmentId}?ai_error=No+text+content+found+to+grade`);
  }

  const assignment = submission.assignments as unknown as {
    title: string;
    description: string | null;
    points_possible: number | null;
  };

  const maxPoints = assignment.points_possible ?? 100;

  let grade: number;
  let feedback: string;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `You are grading a student assignment. Respond ONLY with a valid JSON object with exactly two keys:
- "grade": a number from 0 to ${maxPoints}
- "feedback": a 2-3 sentence constructive comment for the student

No explanation, no markdown, no code fences — raw JSON only.`,
      messages: [
        {
          role: "user",
          content: `Assignment: ${assignment.title}${assignment.description ? `\nDescription: ${assignment.description}` : ""}
Points possible: ${maxPoints}

Student's submission:
${textContent}

Grade this submission.`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

    const parsed = JSON.parse(text);
    grade = Math.min(maxPoints, Math.max(0, Number(parsed.grade)));
    feedback = String(parsed.feedback || "");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    redirect(
      `/professor/assignments/${assignmentId}?ai_error=${encodeURIComponent(`AI grading failed: ${msg}`)}`
    );
  }

  redirect(
    `/professor/assignments/${assignmentId}?ai_grade=${grade!}&ai_feedback=${encodeURIComponent(feedback!)}&ai_for=${submissionId}`
  );
}
