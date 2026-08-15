import type { Metadata } from "next";
import { PaymentResult } from "@/components/payment-result";

export const metadata: Metadata = { title: "Pagamento aprovado", robots: { index: false, follow: false } };
export default function ApprovedPaymentPage() { return <PaymentResult status="approved" />; }

