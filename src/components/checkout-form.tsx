"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { CreditCard, LoaderCircle, LockKeyhole, MapPin, QrCode, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useCart } from "@/components/providers/cart-provider";
import { courses } from "@/lib/products";
import { formatCurrency } from "@/lib/utils";
import { checkoutDetailsSchema, type CheckoutDetailsInput } from "@/lib/validators";

const mercadoPagoPublicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
if (mercadoPagoPublicKey) initMercadoPago(mercadoPagoPublicKey, { locale: "pt-BR" });

type CardData = {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  installments: number;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-red-500">{message}</p> : null;
}

const inputClass = "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10";

export function CheckoutForm({ initialCoupon = "" }: { initialCoupon?: string }) {
  const router = useRouter();
  const { items, subtotal, hydrated, clearCart } = useCart();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CheckoutDetailsInput>({
    resolver: zodResolver(checkoutDetailsSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cpf: "",
      course: "",
      notes: "",
      fulfillment: "pickup",
      postalCode: "",
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
      paymentMethod: "pix",
      couponCode: initialCoupon,
      acceptedTerms: false,
    },
  });

  const fulfillment = useWatch({ control: form.control, name: "fulfillment" });
  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" });
  const couponCode = useWatch({ control: form.control, name: "couponCode" });
  const shipping = fulfillment === "pickup" ? 0 : fulfillment === "local_delivery" ? 8 : 18;
  const discount = couponCode?.trim().toUpperCase() === "BEMVINDO10" ? subtotal * 0.1 : 0;
  const total = useMemo(() => Math.max(0, subtotal - discount + shipping), [discount, shipping, subtotal]);

  async function submitOrder(card?: CardData) {
    const valid = await form.trigger();
    if (!valid) throw new Error("Revise seus dados antes de continuar.");
    if (!items.length) throw new Error("Seu carrinho está vazio.");
    setSubmitting(true);
    setServerError("");
    try {
      const details = form.getValues();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, options: item.options })),
          cardToken: card?.token,
          paymentMethodId: card?.payment_method_id,
          issuerId: card?.issuer_id,
          installments: card?.installments,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        trackingToken?: string;
        orderNumber?: string;
        status?: string;
        paymentId?: number;
        expiresAt?: string;
        pix?: { qrCode?: string; qrCodeBase64?: string; ticketUrl?: string } | null;
      };
      if (!response.ok || !result.trackingToken) throw new Error(result.error ?? "Não foi possível concluir o pedido.");

      window.sessionStorage.setItem(`tuvv-payment:${result.trackingToken}`, JSON.stringify({ ...result, email: details.email, total }));
      clearCart();
      if (result.status === "approved") router.push(`/pagamento/aprovado?token=${result.trackingToken}`);
      else if (result.status === "rejected") router.push(`/pagamento/recusado?token=${result.trackingToken}`);
      else router.push(`/pagamento/pendente?token=${result.trackingToken}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.";
      setServerError(message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return <div className="h-[580px] animate-pulse rounded-3xl bg-slate-100" />;
  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-20 text-center"><p className="font-bold text-slate-900">Seu carrinho está vazio.</p><button onClick={() => router.push("/produtos")} className="mt-4 text-sm font-bold text-sky-600">Voltar para a loja</button></div>;
  }

  const errors = form.formState.errors;
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_390px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-white">1</span><div><h2 className="font-bold text-slate-900">Seus dados</h2><p className="text-xs text-slate-500">Não é necessário criar uma conta.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Nome completo</span><input {...form.register("fullName")} className={inputClass} autoComplete="name" placeholder="Nome e sobrenome" /><FieldError message={errors.fullName?.message} /></label>
            <label><span className="mb-1.5 block text-xs font-bold text-slate-700">E-mail</span><input {...form.register("email")} className={inputClass} type="email" autoComplete="email" placeholder="voce@email.com" /><FieldError message={errors.email?.message} /></label>
            <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Telefone / WhatsApp</span><input {...form.register("phone")} className={inputClass} autoComplete="tel" placeholder="(27) 99999-9999" /><FieldError message={errors.phone?.message} /></label>
            <label><span className="mb-1.5 block text-xs font-bold text-slate-700">CPF</span><input {...form.register("cpf")} className={inputClass} inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" /><FieldError message={errors.cpf?.message} /></label>
            <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Curso</span><select {...form.register("course")} className={inputClass}><option value="">Selecione seu curso</option>{courses.map((course) => <option key={course}>{course}</option>)}</select><FieldError message={errors.course?.message} /></label>
            <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Observações <span className="font-normal text-slate-400">(opcional)</span></span><textarea {...form.register("notes")} className="min-h-24 w-full resize-y rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-sky-500" placeholder="Personalização, instruções ou observações do pedido" /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-white">2</span><div><h2 className="font-bold text-slate-900">Como quer receber?</h2><p className="text-xs text-slate-500">Escolha a modalidade mais conveniente.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: "pickup", label: "Retirada na UVV", detail: "Grátis", icon: MapPin },
              { value: "local_delivery", label: "Entrega local", detail: formatCurrency(8), icon: MapPin },
              { value: "shipping", label: "Envio", detail: formatCurrency(18), icon: MapPin },
            ].map((option) => (
              <label key={option.value} className={`cursor-pointer rounded-xl border p-4 transition ${fulfillment === option.value ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/10" : "border-slate-200 hover:border-sky-300"}`}>
                <input type="radio" value={option.value} {...form.register("fulfillment")} className="sr-only" />
                <option.icon size={19} className="mb-3 text-sky-500" /><strong className="block text-sm text-slate-900">{option.label}</strong><span className="text-xs text-slate-500">{option.detail}</span>
              </label>
            ))}
          </div>
          {fulfillment !== "pickup" && (
            <div className="mt-6 grid gap-4 sm:grid-cols-6">
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">CEP</span><input {...form.register("postalCode")} className={inputClass} placeholder="00000-000" /><FieldError message={errors.postalCode?.message} /></label>
              <label className="sm:col-span-4"><span className="mb-1.5 block text-xs font-bold text-slate-700">Rua</span><input {...form.register("street")} className={inputClass} autoComplete="address-line1" /><FieldError message={errors.street?.message} /></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Número</span><input {...form.register("number")} className={inputClass} /><FieldError message={errors.number?.message} /></label>
              <label className="sm:col-span-4"><span className="mb-1.5 block text-xs font-bold text-slate-700">Complemento</span><input {...form.register("complement")} className={inputClass} autoComplete="address-line2" /></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Bairro</span><input {...form.register("district")} className={inputClass} /><FieldError message={errors.district?.message} /></label>
              <label className="sm:col-span-3"><span className="mb-1.5 block text-xs font-bold text-slate-700">Cidade</span><input {...form.register("city")} className={inputClass} autoComplete="address-level2" /><FieldError message={errors.city?.message} /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700">UF</span><input {...form.register("state")} className={inputClass} maxLength={2} autoComplete="address-level1" /><FieldError message={errors.state?.message} /></label>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-white">3</span><div><h2 className="font-bold text-slate-900">Pagamento</h2><p className="text-xs text-slate-500">Processado com segurança pelo Mercado Pago.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 transition ${paymentMethod === "pix" ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/10" : "border-slate-200"}`}><input type="radio" value="pix" {...form.register("paymentMethod")} className="sr-only" /><QrCode size={21} className="mb-3 text-sky-500" /><strong className="block text-sm">PIX</strong><span className="text-xs text-slate-500">Aprovação rápida</span></label>
            <label className={`cursor-pointer rounded-xl border p-4 transition ${paymentMethod === "card" ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/10" : "border-slate-200"}`}><input type="radio" value="card" {...form.register("paymentMethod")} className="sr-only" /><CreditCard size={21} className="mb-3 text-sky-500" /><strong className="block text-sm">Cartão</strong><span className="text-xs text-slate-500">Até 12 parcelas</span></label>
          </div>
          {paymentMethod === "card" && (
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              {mercadoPagoPublicKey ? (
                <CardPayment
                  initialization={{ amount: total, payer: { email: form.getValues("email"), identification: { type: "CPF", number: form.getValues("cpf").replace(/\D/g, "") } } }}
                  customization={{ paymentMethods: { maxInstallments: 12 }, visual: { style: { theme: "default" } } }}
                  locale="pt-BR"
                  onSubmit={async (cardData) => submitOrder(cardData)}
                  onError={(error) => setServerError(error.message ?? "Não foi possível carregar o formulário do cartão.")}
                />
              ) : (
                <p className="text-sm leading-6 text-amber-700">Configure <code>NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY</code> para habilitar a tokenização segura do cartão.</p>
              )}
            </div>
          )}
          <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-600">
            <input type="checkbox" {...form.register("acceptedTerms")} className="mt-1 h-4 w-4 rounded border-slate-300 accent-sky-500" />
            <span>Li e aceito os <a href="/termos-de-uso" target="_blank" className="font-bold text-sky-600">termos de uso</a> e a <a href="/politica-de-privacidade" target="_blank" className="font-bold text-sky-600">política de privacidade</a>.</span>
          </label>
          <FieldError message={errors.acceptedTerms?.message} />
          {paymentMethod === "pix" && (
            <button type="button" disabled={submitting} onClick={() => void submitOrder().catch(() => undefined)} className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-70">
              {submitting ? <LoaderCircle className="animate-spin" size={19} /> : <LockKeyhole size={18} />} {submitting ? "Criando pedido..." : "Gerar pagamento PIX"}
            </button>
          )}
          {serverError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">{serverError}</div>}
        </section>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-32">
        <h2 className="font-display text-2xl font-black uppercase text-[#001b3b]">Seu pedido</h2>
        <div className="mt-5 max-h-72 space-y-4 overflow-auto pr-1">
          {items.map((item) => <div key={item.lineId} className="flex gap-3 text-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-black text-slate-500">{item.quantity}×</span><span className="min-w-0 flex-1"><strong className="line-clamp-2 block text-slate-800">{item.name}</strong><span className="text-xs text-slate-400">{Object.values(item.options).join(" · ")}</span></span><span className="whitespace-nowrap font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span></div>)}
        </div>
        <label className="mt-6 block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Cupom</span><input {...form.register("couponCode")} className={inputClass} placeholder="Código do cupom" /></label>
        <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Desconto</dt><dd className="text-emerald-600">− {formatCurrency(discount)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Entrega</dt><dd>{shipping ? formatCurrency(shipping) : "Grátis"}</dd></div><div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-black"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div></dl>
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><ShieldCheck size={16} className="mt-0.5 shrink-0" /> O valor final e o estoque são recalculados no servidor antes do pedido.</p>
      </aside>
    </div>
  );
}
