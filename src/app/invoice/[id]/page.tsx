import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { STATES, getProduct } from "@/config/plans";
import { PrintButton } from "@/components/print-button";
import { requireSession } from "@/lib/data";
import { formatMoney } from "@/lib/tax";

type Payment = {
  id: string;
  product_key: string;
  credits: number;
  currency: "USD" | "INR";
  base_minor: number;
  gst_minor: number;
  cgst_minor: number;
  sgst_minor: number;
  igst_minor: number;
  total_minor: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  in_india: boolean;
  state_code: string | null;
  invoice_no: string | null;
  paid_at: string | null;
  razorpay_payment_id: string | null;
  status: string;
};

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSession();
  const { data } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
  const p = data as Payment | null;
  if (!p || !p.invoice_no || !p.paid_at) notFound();

  const product = getProduct(p.product_key);
  const gstin = process.env.SELLER_GSTIN;
  const address = process.env.SELLER_ADDRESS;
  const lut = process.env.SELLER_LUT_NUMBER;
  const state = STATES.find((s) => s.code === p.state_code)?.name;
  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(p.paid_at));
  const money = (n: number) => formatMoney(n, p.currency);

  return (
    <div className="min-h-dvh bg-bg px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl rounded-3xl bg-panel p-8 text-ink print:rounded-none print:bg-white print:text-black print:shadow-none sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold">{gstin ? "Tax invoice" : "Invoice"}</h1>
            <p className="mt-1 text-sm tabular-nums text-ink-2 print:text-neutral-600">{p.invoice_no}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{brand.company.legalName}</p>
            {address && <p className="whitespace-pre-line text-ink-2 print:text-neutral-600">{address}</p>}
            {gstin && <p className="text-ink-2 print:text-neutral-600">GSTIN {gstin}</p>}
            <p className="text-ink-2 print:text-neutral-600">{brand.supportEmail}</p>
          </div>
        </header>

        <section className="mt-10 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-ink-2 print:text-neutral-600">Billed to</p>
            <p className="mt-1 font-medium">{p.customer_name}</p>
            <p>{p.customer_email}</p>
            <p>{p.customer_phone}</p>
          </div>
          <div>
            <p className="text-ink-2 print:text-neutral-600">Date</p>
            <p className="mt-1 font-medium">{date}</p>
            <p className="mt-3 text-ink-2 print:text-neutral-600">Place of supply</p>
            <p className="mt-1 font-medium">{p.in_india ? (state ?? "India") : "Outside India"}</p>
          </div>
        </section>

        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-2 print:border-neutral-300 print:text-neutral-600">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line print:border-neutral-300">
              <td className="py-3">
                {brand.name} credits, {p.credits} credits{product ? ` (${product.kind === "plan" ? `${product.label} plan` : "credit pack"})` : ""}
              </td>
              <td className="py-3 text-right tabular-nums">{money(p.base_minor)}</td>
            </tr>
            {p.cgst_minor > 0 && (
              <>
                <Row label="CGST 9%" value={money(p.cgst_minor)} />
                <Row label="SGST 9%" value={money(p.sgst_minor)} />
              </>
            )}
            {p.igst_minor > 0 && <Row label="IGST 18%" value={money(p.igst_minor)} />}
            <tr className="font-semibold">
              <td className="pt-4">Total</td>
              <td className="pt-4 text-right tabular-nums">{money(p.total_minor)}</td>
            </tr>
          </tbody>
        </table>

        {!p.in_india && lut && (
          <p className="mt-8 text-xs text-ink-2 print:text-neutral-600">
            Export of services. Supply meant for export under Letter of Undertaking without payment of IGST, LUT {lut}.
          </p>
        )}
        <p className="mt-4 text-xs text-ink-2 print:text-neutral-600">
          Paid online. Payment reference {p.razorpay_payment_id}.
        </p>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-line print:border-neutral-300">
      <td className="py-2 text-ink-2 print:text-neutral-600">{label}</td>
      <td className="py-2 text-right tabular-nums">{value}</td>
    </tr>
  );
}
