"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";
import { refundMercadoPagoPayment } from "@/lib/mercado-pago";

export async function updateOrderStatus(formData: FormData) {
  const admin = await requireAdmin("orders.manage");
  const parsed = z.object({ id: z.uuid(), fulfillment_status: z.enum(["received","preparing","ready_for_pickup","shipped","delivered","cancelled"]), tracking_code: z.string().max(120).optional(), internal_notes: z.string().max(2000).optional() }).parse(Object.fromEntries(formData.entries()));
  const supabase = (await createSupabaseServerClient())!;
  const { data: previous } = await supabase.from("orders").select("fulfillment_status,tracking_code,internal_notes").eq("id", parsed.id).single();
  const { error } = await supabase.from("orders").update({ fulfillment_status: parsed.fulfillment_status, tracking_code: parsed.tracking_code || null, internal_notes: parsed.internal_notes || null }).eq("id", parsed.id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_logs").insert({ actor_id: admin.userId, action: "order.update", entity_type: "order", entity_id: parsed.id, previous_data: previous, new_data: parsed });
  revalidatePath(`/admin/pedidos/${parsed.id}`); revalidatePath("/admin/pedidos");
}

export async function cancelOrder(formData: FormData) {
  const admin = await requireAdmin("orders.manage"); const id = z.uuid().parse(formData.get("id")); const supabase = (await createSupabaseServerClient())!;
  const { data: order } = await supabase.from("orders").select("payment_status").eq("id", id).single();
  if (!order) throw new Error("Pedido não encontrado.");
  if (["pending","processing"].includes(order.payment_status)) { const { error } = await supabase.rpc("release_order_reservation", { p_order_id: id, p_reason: "cancelled_by_admin" }); if (error) throw new Error(error.message); }
  else { const { error } = await supabase.from("orders").update({ fulfillment_status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id); if (error) throw new Error(error.message); }
  await supabase.from("audit_logs").insert({ actor_id: admin.userId, action: "order.cancel", entity_type: "order", entity_id: id });
  revalidatePath(`/admin/pedidos/${id}`); revalidatePath("/admin/pedidos");
}

export async function refundOrder(formData: FormData) {
  const admin = await requireAdmin("orders.manage");
  const id = z.uuid().parse(formData.get("id"));
  const supabase = (await createSupabaseServerClient())!;
  const { data: payment } = await supabase.from("payments").select("id,provider_payment_id,status").eq("order_id", id).eq("provider", "mercado_pago").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!payment?.provider_payment_id || payment.status !== "approved") throw new Error("Este pedido não possui pagamento aprovado reembolsável.");
  await refundMercadoPagoPayment(payment.provider_payment_id, randomUUID());
  await supabase.from("payments").update({ status: "refunded" }).eq("id", payment.id);
  await supabase.from("orders").update({ payment_status: "refunded" }).eq("id", id);
  await supabase.from("audit_logs").insert({ actor_id: admin.userId, action: "order.refund", entity_type: "order", entity_id: id, new_data: { provider_payment_id: payment.provider_payment_id } });
  revalidatePath(`/admin/pedidos/${id}`); revalidatePath("/admin/pedidos");
}
