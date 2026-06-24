import { requireFinanceAccess } from "@/lib/auth";

export default async function AdminInvoicesLayout({ children }: { children: React.ReactNode }) {
  await requireFinanceAccess();
  return <>{children}</>;
}
