import { AdminProductForm } from "@/components/admin-product-form";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export default async function NewProductPage() { await requireAdmin("products.manage"); const { data: categories } = await (await createSupabaseServerClient())!.from("categories").select("id,name").eq("active", true).order("sort_order"); return <div className="mx-auto max-w-6xl"><p className="text-sm text-slate-500">Catálogo / Novo</p><h1 className="font-display mb-7 mt-1 text-3xl font-black uppercase text-[#001b3b]">Novo produto</h1><AdminProductForm categories={categories ?? []} /></div>; }
