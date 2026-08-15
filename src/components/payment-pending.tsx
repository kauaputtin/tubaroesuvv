"use client";

import { Check, Clock3, Copy, ExternalLink, LoaderCircle, QrCode } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

type PaymentData = {
  orderNumber?: string;
  trackingToken: string;
  paymentId?: number;
  status?: string;
  expiresAt?: string;
  total?: number;
  email: string;
  pix?: { qrCode?: string; qrCodeBase64?: string; ticketUrl?: string } | null;
};

export function PaymentPending() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [data, setData] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusText, setStatusText] = useState("Aguardando pagamento");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.sessionStorage.getItem(`tuvv-payment:${token}`);
      if (stored) setData(JSON.parse(stored) as PaymentData);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [token]);

  useEffect(() => {
    if (!data?.email || !token) return;
    let active = true;
    const check = async () => {
      try {
        const response = await fetch("/api/orders/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, email: data.email }) });
        if (!response.ok) return;
        const order = (await response.json()) as { paymentStatus: string };
        if (!active) return;
        if (order.paymentStatus === "approved") router.replace(`/pagamento/aprovado?token=${token}`);
        else if (["rejected", "cancelled"].includes(order.paymentStatus)) router.replace(`/pagamento/recusado?token=${token}`);
        else setStatusText(order.paymentStatus === "processing" ? "Pagamento em processamento" : "Aguardando pagamento");
      } catch {
        // A próxima consulta automática tenta novamente.
      }
    };
    void check();
    const interval = window.setInterval(check, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [data?.email, router, token]);

  async function copyPix() {
    if (!data?.pix?.qrCode) return;
    await navigator.clipboard.writeText(data.pix.qrCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!data) {
    return <div className="mx-auto max-w-xl px-4 py-24 text-center"><QrCode size={42} className="mx-auto text-sky-500" /><h1 className="font-display mt-6 text-4xl font-black uppercase text-[#001b3b]">Abra o link do seu pedido</h1><p className="mt-3 text-sm leading-6 text-slate-500">Os dados PIX ficam disponíveis neste navegador após a criação do pedido. Você também pode consultar o status com o token enviado por e-mail.</p><a href="/acompanhar-pedido" className="mt-6 inline-flex rounded-xl bg-sky-500 px-6 py-3 text-sm font-black text-white">Acompanhar pedido</a></div>;
  }

  return (
    <div className="bg-slate-50/70 px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-[#00162f] px-6 py-8 text-center text-white sm:px-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/15 text-sky-300"><Clock3 size={27} /></span>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-sky-300">Pedido {data.orderNumber}</p>
          <h1 className="font-display mt-2 text-4xl font-black uppercase">{statusText}</h1>
          <p className="mt-2 text-sm text-white/60">A confirmação acontece automaticamente. Pode deixar esta página aberta.</p>
        </div>
        <div className="p-6 sm:p-10">
          {data.pix?.qrCodeBase64 && <div className="mx-auto mb-6 w-fit rounded-2xl border border-slate-200 bg-white p-3"><Image src={`data:image/png;base64,${data.pix.qrCodeBase64}`} alt="QR Code PIX do pedido" width={224} height={224} unoptimized className="h-56 w-56" /></div>}
          <div className="text-center"><p className="text-sm text-slate-500">Valor do pagamento</p><strong className="mt-1 block text-3xl font-black text-[#001b3b]">{formatCurrency(data.total ?? 0)}</strong>{data.expiresAt && <p className="mt-2 text-xs text-slate-400">Válido até {formatDate(data.expiresAt)}</p>}</div>
          {data.pix?.qrCode && <div className="mt-7"><label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">PIX copia e cola</label><div className="flex gap-2"><input readOnly value={data.pix.qrCode} className="h-12 min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs text-slate-500" /><button type="button" onClick={copyPix} className="flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-5 text-xs font-black text-white">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copiado" : "Copiar"}</button></div></div>}
          {data.pix?.ticketUrl && <a href={data.pix.ticketUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-sky-600">Abrir pagamento no Mercado Pago <ExternalLink size={15} /></a>}
          <p className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-sky-50 p-4 text-center text-xs text-sky-800"><LoaderCircle size={15} className="animate-spin" /> Verificando o pagamento a cada 5 segundos</p>
        </div>
      </div>
    </div>
  );
}
