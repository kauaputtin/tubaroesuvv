import { AlertTriangle, ArrowUpRight, Banknote, Box, Clock3, CreditCard, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { AdminCharts } from "@/components/admin-charts";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type Summary = { total_revenue: number; total_orders: number; paid_orders: number; pending_orders: number; cancelled_orders: number; average_ticket: number };

export default async function AdminOverviewPage() {
  const admin = await requireAdmin("dashboard.view");
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const chartStart = new Date(today);
  chartStart.setDate(chartStart.getDate() - 7);
  const [{ data: summaryRow }, { data: recentOrders }, { data: lowStock }, { data: chartOrders }] = await Promise.all([
    supabase!.from("admin_dashboard_summary").select("*").single(),
    supabase!.from("orders").select("id,public_number,total,payment_status,fulfillment_status,created_at,customers(full_name)").order("created_at", { ascending: false }).limit(6),
    supabase!.from("products").select("id,name,stock,reserved_stock,minimum_stock").order("stock", { ascending: true }).limit(6),
    supabase!.from("orders").select("total,created_at,payment_status,payments(method)").gte("created_at", chartStart.toISOString()),
  ]);
  const summary = (summaryRow ?? { total_revenue: 0, total_orders: 0, paid_orders: 0, pending_orders: 0, cancelled_orders: 0, average_ticket: 0 }) as Summary;
  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
  const sales = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - offset));
    const key = date.toISOString().slice(0, 10);
    const orders = chartOrders?.filter((order) => order.created_at.slice(0, 10) === key && order.payment_status === "approved") ?? [];
    return { day: dayFormatter.format(date).replace(".", ""), revenue: orders.reduce((sum, order) => sum + Number(order.total), 0), orders: orders.length };
  });
  const payments = ["pix", "card"].map((method) => ({ name: method === "pix" ? "PIX" : "Cartão", value: chartOrders?.filter((order) => { const relation = order.payments as unknown as Array<{ method: string }>; return relation?.some((payment) => payment.method === method); }).length ?? 0 }));
  const statusLabel: Record<string, string> = { pending: "Pendente", processing: "Processando", approved: "Aprovado", rejected: "Recusado", cancelled: "Cancelado", refunded: "Reembolsado" };

  const cards = [
    { label: "Faturamento", value: formatCurrency(Number(summary.total_revenue)), detail: "Pedidos aprovados", icon: Banknote, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Pedidos", value: String(summary.total_orders), detail: `${summary.paid_orders} pagos`, icon: ShoppingCart, tone: "bg-sky-50 text-sky-600" },
    { label: "Ticket médio", value: formatCurrency(Number(summary.average_ticket)), detail: "Média dos aprovados", icon: CreditCard, tone: "bg-violet-50 text-violet-600" },
    { label: "Pendentes", value: String(summary.pending_orders), detail: "Aguardando pagamento", icon: Clock3, tone: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Olá, {admin.fullName.split(" ")[0]} 👋</p><h1 className="font-display mt-1 text-3xl font-black uppercase text-[#001b3b]">Visão geral</h1></div><Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm">Visualizar loja <ArrowUpRight size={15} /></Link></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <section key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><span><span className="text-xs font-semibold text-slate-500">{card.label}</span><strong className="mt-2 block text-2xl font-black text-slate-900">{card.value}</strong><span className="mt-1 block text-xs text-slate-400">{card.detail}</span></span><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}><card.icon size={19} /></span></div></section>)}</div>
      <div className="mt-5"><AdminCharts sales={sales} payments={payments} /></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Pedidos recentes</h2><p className="text-xs text-slate-400">Últimas movimentações da loja</p></div><Link href="/admin/pedidos" className="text-xs font-bold text-sky-600">Ver todos</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-[0.65rem] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Pedido</th><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Pagamento</th><th className="px-5 py-3">Data</th></tr></thead><tbody className="divide-y divide-slate-100">{recentOrders?.map((order) => { const customer = order.customers as unknown as { full_name: string } | null; return <tr key={order.id} className="hover:bg-slate-50"><td className="px-5 py-4"><Link href={`/admin/pedidos/${order.id}`} className="font-bold text-sky-600">{order.public_number}</Link></td><td className="px-5 py-4 font-medium text-slate-700">{customer?.full_name ?? "—"}</td><td className="px-5 py-4 font-bold">{formatCurrency(Number(order.total))}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black ${order.payment_status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{statusLabel[order.payment_status]}</span></td><td className="px-5 py-4 text-xs text-slate-400">{formatDate(order.created_at)}</td></tr>; })}{!recentOrders?.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Nenhum pedido ainda.</td></tr>}</tbody></table></div></section>
        <section className="rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Atenção ao estoque</h2><p className="text-xs text-slate-400">Itens com menor saldo</p></div><Box size={19} className="text-slate-400" /></div><div className="divide-y divide-slate-100">{lowStock?.map((product) => { const available = product.stock - product.reserved_stock; const low = available <= product.minimum_stock; return <div key={product.id} className="flex items-center gap-3 px-5 py-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${low ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>{low ? <AlertTriangle size={17} /> : <Box size={17} />}</span><span className="min-w-0 flex-1"><strong className="truncate text-sm text-slate-800">{product.name}</strong><span className="block text-xs text-slate-400">{product.reserved_stock} reservado</span></span><strong className={low ? "text-amber-600" : "text-slate-700"}>{available}</strong></div>; })}</div></section>
      </div>
    </div>
  );
}
