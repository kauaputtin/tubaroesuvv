import { TrackingForm } from "@/components/tracking-form";

export default async function OrderByTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <div className="bg-slate-50/70 px-4 py-16"><div className="mx-auto mb-8 max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">Pedido protegido</p><h1 className="font-display mt-2 text-4xl font-black uppercase text-[#001b3b]">Consulte o andamento</h1></div><TrackingForm initialToken={token} /></div>;
}

