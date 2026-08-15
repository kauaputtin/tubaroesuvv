import type { Metadata } from "next";
import { TrackingForm } from "@/components/tracking-form";

export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false, follow: false } };
export default function TrackOrderPage() { return <div className="bg-slate-50/70 px-4 py-16"><div className="mx-auto mb-8 max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">Consulta protegida</p><h1 className="font-display mt-2 text-4xl font-black uppercase text-[#001b3b]">Acompanhe seu pedido</h1><p className="mt-3 text-sm leading-6 text-slate-500">Use o token seguro e o e-mail informados na compra.</p></div><TrackingForm /></div>; }

