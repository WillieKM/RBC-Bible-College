"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { sendZoomGroupNow } from "@/lib/actions/zoom";

export function ZoomGroupSendForm({
  groupId,
  groupTitle,
  zoomUrl,
  studentsLabel,
}: {
  groupId: string;
  groupTitle: string;
  zoomUrl: string;
  studentsLabel: string;
}) {
  const [sendTo, setSendTo] = useState<"all" | "specific">("all");

  return (
    <form action={sendZoomGroupNow} className="mt-3 space-y-3">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="group_title" value={groupTitle} />
      <input type="hidden" name="zoom_url" value={zoomUrl} />
      <input type="hidden" name="send_to" value={sendTo} />

      <div>
        <label className="block text-xs font-medium text-slate-600">Send to</label>
        <select
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value as "all" | "specific")}
          className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">{studentsLabel}</option>
          <option value="specific">Specific emails only</option>
        </select>
      </div>

      {sendTo === "specific" && (
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Emails{" "}
            <span className="font-normal text-slate-400">(comma or newline separated)</span>
          </label>
          <textarea
            name="specific_emails"
            rows={3}
            placeholder="pastor@example.com, guest@example.com"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <DeleteButton
          label="Send Now →"
          pendingLabel="Sending…"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        />
        <a
          href={zoomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs text-gold-dark hover:underline"
        >
          {zoomUrl}
        </a>
      </div>
    </form>
  );
}
