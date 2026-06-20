"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton({ label, pendingLabel, className }: { label: string; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Deleting…") : label}
    </button>
  );
}
