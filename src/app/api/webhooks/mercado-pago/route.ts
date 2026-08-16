import { NextResponse } from "next/server";
import { getMercadoPagoPayment, mapPaymentStatus, resumoDoPagamento, validateMercadoPagoSignature } from "@/lib/mercado-pago";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { data?: { id?: string | number }; id?: string | number; type?: string };
  const url = new URL(request.url);
  const dataId = String(url.searchParams.get("data.id") ?? body.data?.id ?? body.id ?? "");
  const valid = validateMercadoPagoSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  if (!dataId || (body.type && body.type !== "payment")) return NextResponse.json({ received: true });

  try {
    const payment = await getMercadoPagoPayment(dataId);
    const supabase = createAdminClient();
    const eventId = `${dataId}:${payment.date_last_updated ?? payment.status ?? "unknown"}`;
    const { error } = await supabase.rpc("process_payment_status", {
      p_provider: "mercado_pago",
      p_event_id: eventId,
      p_payment_id: String(payment.id),
      p_order_id: payment.external_reference,
      p_status: mapPaymentStatus(payment.status),
      p_payload: resumoDoPagamento(payment),
    });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("mercado_pago_webhook", error);
    return NextResponse.json({ error: "Falha temporária ao processar o evento." }, { status: 500 });
  }
}

