"use client";

import { useFormStatus } from "react-dom";

export function SubmitAssignmentButton({ isResubmit }: { isResubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Submitting… please wait" : isResubmit ? "Resubmit" : "Submit"}
    </button>
  );
}
