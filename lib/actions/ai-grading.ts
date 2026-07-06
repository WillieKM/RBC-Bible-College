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

  if (!textContent) {
    redirect(`/professor/assignments/${assignmentId}?ai_error=No+text+content+found+to+grade`);
  }

  const assignment = submission.assignments as unknown as {
    title: string;
    description: string | null;
    points_possible: number | null;
  };

  const client = new Anthropic();
  const maxPoints = assignment.points_possible ?? 100;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            grade: {
              type: "number",
              description: `Score from 0 to ${maxPoints}`,
            },
            feedback: {
              type: "string",
              description: "Constructive 2–3 sentence feedback for the student",
            },
          },
          required: ["grade", "feedback"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `You are grading a student assignment. Be fair, clear, and constructive.

Assignment: ${assignment.title}${assignment.description ? `\nDescription: ${assignment.description}` : ""}
Points possible: ${maxPoints}

Student's submission:
${textContent}

Return a grade (0–${maxPoints}) and brief feedback.`,
      },
    ],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  let grade: number;
  let feedback: string;

  try {
    const parsed = JSON.parse(text);
    grade = Math.min(maxPoints, Math.max(0, Number(parsed.grade)));
    feedback = String(parsed.feedback || "");
  } catch {
    redirect(
      `/professor/assignments/${assignmentId}?ai_error=AI+response+could+not+be+parsed`
    );
  }

  redirect(
    `/professor/assignments/${assignmentId}?ai_grade=${grade}&ai_feedback=${encodeURIComponent(feedback)}&ai_for=${submissionId}`
  );
}
