"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div key={path} style={{ animation: "pageIn 0.22s ease-out both" }}>
      {children}
    </div>
  );
}
