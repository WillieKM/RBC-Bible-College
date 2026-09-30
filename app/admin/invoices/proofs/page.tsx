import { createAdminClient } from "@/lib/supabase/admin";
import { markProofReviewed } from "@/lib/actions/invoices";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";

type Proof = {
  id: string;
  invoice_id: string;
  amount: number;
  reference: string;
  payment_date: string;
  screenshot_url: string | null;
  notes: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  created_at: string;
  profiles: { full_name: string; email: string; region: string | null } | null;
  invoices: { title: string } | null;
};

function ProofCard({ proof, showReview }: { proof: Proof; showReview: boolean }) {
  const currency = proof.profiles?.region === "usa" ? "$" : "KSh";
  return (
    <div className={`rounded-xl border bg-white px-5 py-4 shadow-sm ${proof.reviewed ? "border-slate-200 opacity-75" : "border-amber-300"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-slate-900">
            {proof.profiles?.full_name ?? "Unknown"} — {currency}{proof.amount.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">{proof.invoices?.title ?? "Invoice"}</p>
          <p className="mt-1 text-xs text-slate-400">
            Ref: <span className="font-mono font-medium text-slate-700">{proof.reference}</span>
            {" · "}Date: {proof.payment_date}
            {" · "}Submitted: {new Date(proof.created_at).toLocaleString()}
          </p>
          {proof.screenshot_url && (
            <a
              href={proof.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
            >
              View screenshot →
            </a>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href={`/admin/invoices/${proof.invoice_id}`}
            className="text-sm font-medium text-gold-dark hover:underline"
          >
            Open invoice
          </Link>
          {showReview && (
            <form action={markProofReviewed}>
              <input type="hidden" name="id" value={proof.id} />
              <DeleteButton
                label="Mark reviewed"
                pendingLabel="Saving…"
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              />
            </form>
          )}
          {proof.reviewed && proof.reviewed_at && (
            <span className="text-xs text-green-600">
              Reviewed {new Date(proof.reviewed_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RegionSection({
  title,
  proofs,
  showReview,
  emptyText,
}: {
  title: string;
  proofs: Proof[];
  showReview: boolean;
  emptyText: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title} <span className="ml-1 font-normal normal-case text-slate-400">({proofs.length})</span>
      </h3>
      {proofs.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {proofs.map((p) => <ProofCard key={p.id} proof={p} showReview={showReview} />)}
        </div>
      )}
    </div>
  );
}

export default async function AdminProofsPage() {
  const supabase = createAdminClient();

  const { data: proofsRaw } = await supabase
    .from("payment_proofs")
    .select("*, profiles(full_name, email, region), invoices(title)")
    .order("created_at", { ascending: false });

  const proofs = (proofsRaw ?? []) as Proof[];
  const pending = proofs.filter((p) => !p.reviewed);
  const reviewed = proofs.filter((p) => p.reviewed);

  const usaPending     = pending.filter((p) => p.profiles?.region === "usa");
  const kenyaPending   = pending.filter((p) => p.profiles?.region !== "usa");
  const usaReviewed    = reviewed.filter((p) => p.profiles?.region === "usa");
  const kenyaReviewed  = reviewed.filter((p) => p.profiles?.region !== "usa");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payment Proofs</h1>
        <Link href="/admin/invoices" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Invoices
        </Link>
      </div>

      {/* Pending */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-amber-700">
          Pending Review ({pending.length})
        </h2>
        <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:gap-6">
          <RegionSection
            title="Kenya / International (M-Pesa)"
            proofs={kenyaPending}
            showReview
            emptyText="No pending Kenya proofs."
          />
          <div className="hidden lg:block w-px bg-slate-200 self-stretch" />
          <RegionSection
            title="USA Campus (Zelle / Cash App)"
            proofs={usaPending}
            showReview
            emptyText="No pending USA proofs."
          />
        </div>
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-600">
            Reviewed ({reviewed.length})
          </h2>
          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:gap-6">
            <RegionSection
              title="Kenya / International"
              proofs={kenyaReviewed}
              showReview={false}
              emptyText="None."
            />
            <div className="hidden lg:block w-px bg-slate-200 self-stretch" />
            <RegionSection
              title="USA Campus"
              proofs={usaReviewed}
              showReview={false}
              emptyText="None."
            />
          </div>
        </div>
      )}
    </div>
  );
}
