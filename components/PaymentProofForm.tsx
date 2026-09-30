"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitPaymentProof } from "@/lib/actions/invoices";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Submitting…" : "Submit Proof"}
    </button>
  );
}

export function PaymentProofForm({
  invoiceId,
  balance,
  isUSA,
}: {
  invoiceId: string;
  balance: number;
  isUSA: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-slate-100">
      {!open ? (
        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full rounded-lg border-2 border-gold bg-gold/10 px-4 py-3 text-sm font-semibold text-gold-dark hover:bg-gold/20 transition-colors"
          >
            ✓ I Have Paid — Submit Proof
          </button>
        </div>
      ) : (
        <form
          action={submitPaymentProof}
          encType="multipart/form-data"
          className="px-5 pb-5 pt-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-slate-700">Submit Payment Proof</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <input type="hidden" name="invoice_id" value={invoiceId} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Amount paid
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={balance.toFixed(2)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date paid</label>
              <input
                name="payment_date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {isUSA ? "Zelle / CashApp reference number" : "M-Pesa transaction code"}
            </label>
            <input
              name="reference"
              type="text"
              required
              placeholder={isUSA ? "e.g. Zelle confirmation number" : "e.g. QHX2KXXXXX"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Screenshot <span className="font-normal text-slate-400">(optional but recommended)</span>
            </label>
            <input
              name="screenshot"
              type="file"
              accept="image/*,.pdf"
              className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gold/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gold-dark"
            />
          </div>

          <SubmitBtn />
          <p className="text-xs text-slate-400">
            The finance team will verify your payment within 1–2 business days and update your balance. You&apos;ll receive an email confirmation.
          </p>
        </form>
      )}
    </div>
  );
}
