import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createMercadoPagoPayment, isMercadoPagoConfigured } from "@/lib/mercado-pago";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validators";

type OrderRpcResult = {
  order_id: string;
  order_number: string;
  tracking_token: string;
};

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`checkout:${ip}`, 8, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revise os dados informados.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  if (!isSupabaseConfigured() || !isMercadoPagoConfigured()) {
    return NextResponse.json(
      {
        error: "Checkout aguardando a configuração segura do Supabase e do Mercado Pago.",
        code: "CONFIGURATION_REQUIRED",
      },
      { status: 503 },
    );
  }

  const supabase = createAdminClient();
  const { data: quoteData, error: quoteError } = await supabase.rpc("quote_order", {
    p_items: parsed.data.items,
    p_fulfillment: parsed.data.fulfillment,
    p_coupon_code: parsed.data.couponCode || null,
  });
  if (quoteError || !quoteData) return NextResponse.json({ error: quoteError?.message ?? "Não foi possível calcular o pedido." }, { status: 409 });
  const quote = quoteData as unknown as { subtotal: number; discount: number; shipping: number; total: number; couponCode: string | null };
  const calculated = { ...quote, items: parsed.data.items };
  const { data: orderData, error: orderError } = await supabase.rpc("create_pending_order", {
    p_customer: {
      full_name: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      cpf: parsed.data.cpf.replace(/\D/g, ""),
      course: parsed.data.course,
    },
    p_address: parsed.data.fulfillment === "pickup" ? null : {
      postal_code: parsed.data.postalCode,
      street: parsed.data.street,
      number: parsed.data.number,
      complement: parsed.data.complement,
      district: parsed.data.district,
      city: parsed.data.city,
      state: parsed.data.state,
    },
    p_items: calculated.items,
    p_fulfillment: parsed.data.fulfillment,
    p_payment_method: parsed.data.paymentMethod,
    p_notes: parsed.data.notes,
    p_coupon_code: calculated.couponCode,
    p_subtotal: calculated.subtotal,
    p_discount: calculated.discount,
    p_shipping: calculated.shipping,
    p_total: calculated.total,
    p_reservation_minutes: Number(process.env.STOCK_RESERVATION_MINUTES ?? 30),
  });

  if (orderError || !orderData) {
    console.error("create_pending_order", orderError);
    return NextResponse.json({ error: orderError?.message ?? "Não foi possível reservar os itens." }, { status: 409 });
  }

  const order = orderData as unknown as OrderRpcResult;
  const idempotencyKey = randomUUID();
  try {
    const payment = await createMercadoPagoPayment({
      orderId: order.order_id,
      orderNumber: order.order_number,
      amount: calculated.total,
      paymentMethod: parsed.data.paymentMethod,
      email: parsed.data.email,
      cpf: parsed.data.cpf,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      token: parsed.data.cardToken,
      paymentMethodId: parsed.data.paymentMethodId,
      issuerId: parsed.data.issuerId,
      installments: parsed.data.installments,
      idempotencyKey,
    });

    const status = payment.status ?? "pending";
    await supabase.from("payments").insert({
      order_id: order.order_id,
      provider: "mercado_pago",
      provider_payment_id: String(payment.id),
      method: parsed.data.paymentMethod,
      status,
      amount: calculated.total,
      installments: payment.installments ?? 1,
      idempotency_key: idempotencyKey,
      raw_response: payment,
    });
    await supabase.from("orders").update({ payment_status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending" }).eq("id", order.order_id);

    const pix = payment.point_of_interaction?.transaction_data;
    return NextResponse.json({
      orderNumber: order.order_number,
      trackingToken: order.tracking_token,
      paymentId: payment.id,
      status,
      statusDetail: payment.status_detail,
      expiresAt: payment.date_of_expiration,
      pix: pix ? { qrCode: pix.qr_code, qrCodeBase64: pix.qr_code_base64, ticketUrl: pix.ticket_url } : null,
    });
  } catch (error) {
    console.error("mercado_pago_create", error);
    await supabase.rpc("release_order_reservation", { p_order_id: order.order_id, p_reason: "payment_creation_failed" });
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Nenhum valor foi cobrado." }, { status: 502 });
  }
}
