import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cupom?: string }> }) {
  const { cupom = "" } = await searchParams;
  return (
    <div className="bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Compra segura</p>
        <h1 className="font-display mb-9 text-4xl font-black uppercase text-[#001b3b] sm:text-5xl">Finalizar pedido</h1>
        <CheckoutForm initialCoupon={cupom} />
      </div>
    </div>
  );
}

