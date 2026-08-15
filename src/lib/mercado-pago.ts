import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

function mercadoPagoConfig() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago não configurado.");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

function paymentClient() {
  return new Payment(mercadoPagoConfig());
}

export async function createMercadoPagoPayment(input: {
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: "pix" | "card";
  email: string;
  cpf: string;
  fullName: string;
  phone: string;
  token?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments?: number;
  idempotencyKey: string;
}) {
  const [firstName, ...lastName] = input.fullName.trim().split(/\s+/);
  const expiration = new Date(Date.now() + Number(process.env.STOCK_RESERVATION_MINUTES ?? 30) * 60_000);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const body = {
    transaction_amount: input.amount,
    description: `Pedido ${input.orderNumber} — Tubarões UVV`,
    external_reference: input.orderId,
    notification_url: `${siteUrl}/api/webhooks/mercado-pago`,
    date_of_expiration: expiration.toISOString(),
    payment_method_id: input.paymentMethod === "pix" ? "pix" : input.paymentMethodId,
    token: input.paymentMethod === "card" ? input.token : undefined,
    installments: input.paymentMethod === "card" ? input.installments ?? 1 : undefined,
    issuer_id: input.paymentMethod === "card" && input.issuerId ? Number(input.issuerId) : undefined,
    statement_descriptor: "TUBAROES UVV",
    payer: {
      email: input.email,
      first_name: firstName,
      last_name: lastName.join(" "),
      identification: { type: "CPF", number: input.cpf.replace(/\D/g, "") },
      phone: { number: input.phone.replace(/\D/g, "") },
    },
    metadata: { order_id: input.orderId, order_number: input.orderNumber },
  };

  return paymentClient().create({ body, requestOptions: { idempotencyKey: input.idempotencyKey } });
}

export async function getMercadoPagoPayment(paymentId: string) {
  return paymentClient().get({ id: paymentId });
}

export async function refundMercadoPagoPayment(paymentId: string, idempotencyKey: string) {
  return new PaymentRefund(mercadoPagoConfig()).total({ payment_id: paymentId, requestOptions: { idempotencyKey } });
}

export function validateMercadoPagoSignature(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret || !input.signature || !input.requestId || !input.dataId) return false;
  const parts = Object.fromEntries(input.signature.split(",").map((part) => part.trim().split("=")).filter((entry) => entry.length === 2));
  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received || !/^\d+$/.test(ts) || Date.now() - Number(ts) * 1000 > 5 * 60_000) return false;
  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}
