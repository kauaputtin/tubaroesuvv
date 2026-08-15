import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmedPage() { return <div className="mx-auto max-w-xl px-4 py-24 text-center"><CheckCircle2 size={64} className="mx-auto text-emerald-500" /><h1 className="font-display mt-6 text-4xl font-black uppercase text-[#001b3b]">Pedido criado</h1><p className="mt-3 text-sm leading-6 text-slate-500">Seu pedido foi registrado e aguarda a confirmação do pagamento.</p><Link href="/acompanhar-pedido" className="mt-7 inline-flex rounded-xl bg-sky-500 px-6 py-3 text-sm font-black text-white">Acompanhar pedido</Link></div>; }

