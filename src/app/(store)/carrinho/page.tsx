"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, hydrated, updateQuantity, removeItem } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const discount = useMemo(() => (coupon === "BEMVINDO10" ? subtotal * 0.1 : 0), [coupon, subtotal]);

  function applyCoupon() {
    const normalized = couponInput.trim().toUpperCase();
    if (normalized === "BEMVINDO10") {
      setCoupon(normalized);
      setCouponMessage("Cupom aplicado: 10% de desconto.");
    } else {
      setCoupon("");
      setCouponMessage("Cupom inválido ou expirado.");
    }
  }

  if (!hydrated) {
    return <div className="mx-auto max-w-7xl px-4 py-16"><div className="h-96 animate-pulse rounded-3xl bg-slate-100" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-sky-500"><ShoppingBag size={34} /></span>
        <h1 className="font-display mt-7 text-4xl font-black uppercase text-[#001b3b]">Seu carrinho está vazio</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Parece que nenhum produto entrou no seu cardume ainda.</p>
        <Link href="/produtos" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-black text-white"><ArrowLeft size={17} /> Explorar produtos</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Sua seleção</p>
        <h1 className="font-display text-4xl font-black uppercase text-[#001b3b] sm:text-5xl">Carrinho</h1>
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Itens no carrinho">
            {items.map((item) => (
              <div key={item.lineId} className="grid grid-cols-[88px_1fr] gap-4 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[110px_1fr_auto] sm:p-6">
                <Link href={`/produto/${item.slug}`} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"><Image src={item.image} alt={item.name} fill sizes="110px" className="object-cover" /></Link>
                <div className="min-w-0">
                  <Link href={`/produto/${item.slug}`} className="font-bold text-slate-900 hover:text-sky-600">{item.name}</Link>
                  {Object.keys(item.options).length > 0 && <p className="mt-1 text-xs text-slate-500">{Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(" · ")}</p>}
                  <p className="mt-2 text-xs text-slate-400">SKU {item.sku}</p>
                  <div className="mt-4 flex w-28 items-center justify-between rounded-lg border border-slate-200 p-1">
                    <button type="button" onClick={() => updateQuantity(item.lineId, item.quantity - 1)} className="p-1.5" aria-label="Diminuir quantidade"><Minus size={14} /></button>
                    <span className="text-sm font-bold tabular-nums">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.lineId, item.quantity + 1)} className="p-1.5" aria-label="Aumentar quantidade"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="col-start-2 flex items-center justify-between gap-4 sm:col-start-auto sm:flex-col sm:items-end">
                  <strong className="text-base text-[#001b3b]">{formatCurrency(item.unitPrice * item.quantity)}</strong>
                  <button type="button" onClick={() => removeItem(item.lineId)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500" aria-label={`Remover ${item.name}`}><Trash2 size={15} /> Remover</button>
                </div>
              </div>
            ))}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-32">
            <h2 className="font-display text-2xl font-black uppercase text-[#001b3b]">Resumo</h2>
            <div className="mt-6 flex gap-2">
              <input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Cupom de desconto" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-sky-500" />
              <button type="button" onClick={applyCoupon} className="rounded-xl border border-[#001b3b] px-4 text-xs font-black text-[#001b3b] hover:bg-slate-50">Aplicar</button>
            </div>
            {couponMessage && <p className={`mt-2 text-xs ${coupon ? "text-emerald-600" : "text-red-500"}`} role="status">{couponMessage}</p>}
            <dl className="mt-7 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Desconto</dt><dd className="text-emerald-600">− {formatCurrency(discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Entrega</dt><dd className="text-slate-400">Calculada no checkout</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-black"><dt>Total parcial</dt><dd>{formatCurrency(subtotal - discount)}</dd></div>
            </dl>
            <Link href={`/checkout${coupon ? `?cupom=${coupon}` : ""}`} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600">Ir para o checkout <ArrowRight size={18} /></Link>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="text-emerald-500" /> Preços e estoque revalidados no servidor</p>
            <Link href="/produtos" className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-600"><ArrowLeft size={14} /> Continuar comprando</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

