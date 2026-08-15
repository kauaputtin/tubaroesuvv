import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { trackingSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`tracking:${ip}`, 20, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Muitas consultas. Aguarde alguns minutos." }, { status: 429 });
  }

  const parsed = trackingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe o token e o e-mail usados na compra." }, { status: 422 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Consulta de pedidos aguardando configuração do Supabase." }, { status: 503 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("public_number,payment_status,fulfillment_status,fulfillment_type,total,created_at,tracking_code,customers!inner(email),payments(provider_payment_id,status,method,expires_at)")
    .eq("tracking_token", parsed.data.token)
    .eq("customers.email", parsed.data.email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("order_status", error);
    return NextResponse.json({ error: "Não foi possível consultar o pedido." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Pedido não encontrado. Confira o link e o e-mail." }, { status: 404 });

  return NextResponse.json({
    orderNumber: data.public_number,
    paymentStatus: data.payment_status,
    fulfillmentStatus: data.fulfillment_status,
    fulfillmentType: data.fulfillment_type,
    total: data.total,
    createdAt: data.created_at,
    trackingCode: data.tracking_code,
    payment: Array.isArray(data.payments) ? data.payments.at(-1) : data.payments,
  });
}

