"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton({
  label,
  pendingLabel,
  className,
  confirmMessage,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={className}
      onClick={
        confirmMessage
          ? (e) => { if (!window.confirm(confirmMessage)) e.preventDefault(); }
          : undefined
      }
    >
      {pending ? (pendingLabel ?? "Deleting…") : label}
    </button>
  );
}
