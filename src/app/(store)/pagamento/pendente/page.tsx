import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentPending } from "@/components/payment-pending";

export const metadata: Metadata = { title: "Pagamento pendente", robots: { index: false, follow: false } };

export default function PendingPaymentPage() {
  return <Suspense fallback={<div className="mx-auto my-20 h-96 max-w-2xl animate-pulse rounded-3xl bg-slate-100" />}><PaymentPending /></Suspense>;
}

