"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const stockSchema = z.object({
  productId: z.string().min(1),
  stock: z.number().int().min(0).max(1_000_000),
});

export async function setStock(productId: string, stock: number): Promise<{ stock?: number; error?: string }> {
  await requireAdmin("inventory.manage");
  const parsed = stockSchema.safeParse({ productId, stock });
  if (!parsed.success) return { error: "Informe uma quantidade inteira maior ou igual a zero." };

  const supabase = (await createSupabaseServerClient())!;
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock,reserved_stock")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (productError || !product) return { error: "Produto não encontrado." };
  if (parsed.data.stock < product.reserved_stock) return { error: `O estoque não pode ser menor que as ${product.reserved_stock} unidades reservadas.` };

  const delta = parsed.data.stock - product.stock;
  if (delta === 0) return { stock: product.stock };
  const { data: updatedStock, error } = await supabase.rpc("adjust_inventory", {
    p_product_id: parsed.data.productId,
    p_delta: delta,
    p_reason: `Estoque alterado diretamente de ${product.stock} para ${parsed.data.stock}`,
  });
  if (error) {
    if (error.message.toLocaleLowerCase("pt-BR").includes("reservado")) return { error: "O estoque não pode ser menor que a quantidade reservada." };
    return { error: "Não foi possível atualizar o estoque." };
  }

  updateTag("catalog-products");
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  return { stock: Number(updatedStock) };
}
