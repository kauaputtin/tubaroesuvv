"use client";

import { LoaderCircle, PackageCheck, Search } from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

type OrderStatus = { orderNumber: string; paymentStatus: string; fulfillmentStatus: string; total: number; createdAt: string; trackingCode?: string | null };

const paymentLabels: Record<string, string> = { pending: "Pendente", processing: "Processando", approved: "Aprovado", rejected: "Recusado", cancelled: "Cancelado", refunded: "Reembolsado" };
const fulfillmentLabels: Record<string, string> = { received: "Pedido recebido", preparing: "Em preparação", ready_for_pickup: "Pronto para retirada", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado" };

export function TrackingForm({ initialToken = "" }: { initialToken?: string }) {
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderStatus | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setOrder(null);
    try {
      const response = await fetch("/api/orders/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, email }) });
      const result = await response.json() as OrderStatus & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Pedido não encontrado.");
      setOrder(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível consultar o pedido."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid gap-4"><label><span className="mb-1.5 block text-xs font-bold text-slate-700">Token seguro do pedido</span><input value={token} onChange={(event) => setToken(event.target.value)} required minLength={32} className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" placeholder="Cole o token recebido após a compra" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-700">E-mail da compra</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" placeholder="voce@email.com" /></label><button disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 text-sm font-black text-white">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Search size={18} />} Consultar pedido</button></div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
      </form>
      {order && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-wider text-sky-600">{order.orderNumber}</p><h2 className="mt-1 text-xl font-black text-[#001b3b]">{fulfillmentLabels[order.fulfillmentStatus] ?? order.fulfillmentStatus}</h2><p className="mt-1 text-xs text-slate-400">Criado em {formatDate(order.createdAt)}</p></div><PackageCheck className="text-sky-500" size={34} /></div><dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-5 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Pagamento</dt><dd className="mt-1 font-bold">{paymentLabels[order.paymentStatus] ?? order.paymentStatus}</dd></div><div><dt className="text-xs text-slate-500">Total</dt><dd className="mt-1 font-bold">{formatCurrency(Number(order.total))}</dd></div>{order.trackingCode && <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Rastreamento</dt><dd className="mt-1 font-bold">{order.trackingCode}</dd></div>}</dl></div>}
    </div>
  );
}

