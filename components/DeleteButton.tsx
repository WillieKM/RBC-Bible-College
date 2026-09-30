"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton({
  label,
  pendingLabel,
  className,
  confirmMessage,
  disabled: externalDisabled,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || externalDisabled}
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
