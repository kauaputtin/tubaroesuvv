import type { Metadata } from "next";
import { PaymentResult } from "@/components/payment-result";

export const metadata: Metadata = { title: "Pagamento recusado", robots: { index: false, follow: false } };
export default function RejectedPaymentPage() { return <PaymentResult status="rejected" />; }

