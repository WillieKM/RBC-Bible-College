"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { path: "/apply?region=usa", label: "RBC Diploma — USA Campus" },
  { path: "/apply?region=international", label: "RBC Diploma — Kenya / International" },
  { path: "/apply/degree?region=usa", label: "TBCS Degree — USA Campus" },
  { path: "/apply/degree?region=international", label: "TBCS Degree — Kenya / International" },
];

export function ApplyLinks() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function copy(path: string) {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(path);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mt-3 space-y-2">
      {LINKS.map((link) => (
        <div key={link.path} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">{link.label}</p>
            <p className="text-sm text-slate-500">{origin}{link.path}</p>
          </div>
          <button
            onClick={() => copy(link.path)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {copied === link.path ? "Copied!" : "Copy Link"}
          </button>
        </div>
      ))}
    </div>
  );
}
