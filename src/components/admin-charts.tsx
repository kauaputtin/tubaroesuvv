"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export function AdminCharts({ sales, payments }: { sales: Array<{ day: string; revenue: number; orders: number }>; payments: Array<{ name: string; value: number }> }) {
  const colors = ["#0a87f5", "#001b3b", "#38bdf8", "#94a3b8"];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-6"><h2 className="font-bold text-slate-900">Vendas nos últimos 7 dias</h2><p className="text-xs text-slate-400">Receita de pedidos aprovados</p></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={sales}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(value) => `R$${value}`} /><Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /><Bar dataKey="revenue" fill="#0a87f5" radius={[7, 7, 0, 0]} maxBarSize={48} /></BarChart></ResponsiveContainer></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-3"><h2 className="font-bold text-slate-900">Formas de pagamento</h2><p className="text-xs text-slate-400">Distribuição dos pedidos</p></div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={payments} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={4}>{payments.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-3">{payments.map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className="text-slate-500">{item.name}</span><strong className="ml-auto">{item.value}</strong></div>)}</div></section>
    </div>
  );
}

