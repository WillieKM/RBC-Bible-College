"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "rbc_announcements_seen";

export function AnnouncementNewBadge({
  createdAt,
  announcementId,
}: {
  createdAt: string;
  announcementId: string;
}) {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    try {
      const seenRaw = localStorage.getItem(STORAGE_KEY);
      const seen: Record<string, true> = seenRaw ? JSON.parse(seenRaw) : {};

      if (!seen[announcementId]) {
        // Only mark as new if posted within the last 7 days
        const age = Date.now() - new Date(createdAt).getTime();
        if (age < 7 * 24 * 60 * 60 * 1000) {
          setIsNew(true);
        }
        // Mark as seen
        seen[announcementId] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
      }
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [announcementId, createdAt]);

  if (!isNew) return null;

  return (
    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
      New
    </span>
  );
}
