import Link from "next/link";
import { CheckCircle2, MessageCircle, ShoppingBag, XCircle } from "lucide-react";

export function PaymentResult({ status }: { status: "approved" | "rejected" }) {
  const approved = status === "approved";
  return (
    <div className="bg-slate-50/70 px-4 py-20">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-12">
        <span className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${approved ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}>{approved ? <CheckCircle2 size={40} /> : <XCircle size={40} />}</span>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-sky-600">{approved ? "Tudo certo" : "Não foi dessa vez"}</p>
        <h1 className="font-display mt-2 text-4xl font-black uppercase text-[#001b3b]">{approved ? "Pagamento aprovado!" : "Pagamento recusado"}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">{approved ? "Recebemos seu pagamento e o cardume já começou a preparar o pedido. Você receberá as próximas atualizações por e-mail e WhatsApp." : "Nenhum valor foi cobrado. Confira os dados do cartão ou escolha PIX para tentar novamente."}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={approved ? "/acompanhar-pedido" : "/checkout"} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-black text-white">{approved ? <ShoppingBag size={17} /> : null}{approved ? "Acompanhar pedido" : "Tentar novamente"}</Link>
          <a href="https://wa.me/5527999999999" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-700"><MessageCircle size={17} /> Falar com a gente</a>
        </div>
      </div>
    </div>
  );
}

