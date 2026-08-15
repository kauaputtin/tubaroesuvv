import { notFound } from "next/navigation";
import { AdminProductForm } from "@/components/admin-product-form";
import { addProductOption, addProductVariant, deleteProductVariant } from "@/app/(dashboard)/admin/produtos/actions";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("products.manage");
  const { id } = await params;
  const supabase = (await createSupabaseServerClient())!;
  const [
    { data },
    { data: categories },
    { data: relation },
    { data: options },
    { data: variants },
    { data: images },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name").eq("active", true).order("sort_order"),
    supabase.from("product_categories").select("category_id").eq("product_id", id).limit(1).maybeSingle(),
    supabase.from("product_options").select("id,name,required,product_option_values(id,value,sort_order)").eq("product_id", id).order("sort_order"),
    supabase.from("product_variants").select("id,sku,price,stock,reserved_stock,image_url,active,variant_option_values(product_option_values(value,product_options(name)))").eq("product_id", id).order("created_at"),
    supabase.from("product_images").select("id,url,sort_order,is_primary").eq("product_id", id).order("sort_order"),
  ]);

  if (!data) notFound();

  const galleryImages = images?.length
    ? images.map((image) => ({ id: image.id, url: image.url }))
    : data.main_image_url
      ? [{ id: "legacy", url: data.main_image_url }]
      : [];
  const allValues = (options ?? []).flatMap((option) =>
    (option.product_option_values as unknown as Array<{ id: string; value: string }>).map((value) => ({ ...value, optionName: option.name })),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm text-slate-500">Catálogo / Editar</p>
      <h1 className="font-display mb-7 mt-1 text-3xl font-black uppercase text-[#001b3b]">Editar produto</h1>
      <AdminProductForm product={data} categories={categories ?? []} selectedCategory={relation?.category_id ?? ""} images={galleryImages} />

      <section className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold">Opções do produto</h2>
          <div className="mt-4 space-y-3">
            {options?.map((option) => (
              <div key={option.id} className="rounded-xl bg-slate-50 p-4">
                <strong className="text-sm">{option.name}</strong>
                <p className="mt-1 text-xs text-slate-500">{(option.product_option_values as unknown as Array<{ value: string }>).map((value) => value.value).join(" · ")}</p>
              </div>
            ))}
          </div>
          <form action={addProductOption} className="mt-5 grid gap-3 border-t border-slate-100 pt-5">
            <input type="hidden" name="product_id" value={id} />
            <input name="name" required placeholder="Ex.: Tamanho" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            <input name="values" required placeholder="PP, P, M, G, GG" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            <label className="text-xs"><input name="required" type="checkbox" defaultChecked className="mr-2 accent-sky-500" />Seleção obrigatória</label>
            <button className="h-10 rounded-xl bg-slate-900 text-xs font-bold text-white">Adicionar opção</button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold">Variações</h2>
          <div className="mt-4 space-y-3">
            {variants?.map((variant) => {
              const values = (variant.variant_option_values as unknown as Array<{ product_option_values: { value: string; product_options: { name: string } } }>).map((item) => `${item.product_option_values.product_options.name}: ${item.product_option_values.value}`).join(" · ");
              return (
                <div key={variant.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm">{variant.sku}</strong>
                    <span className="block text-xs text-slate-500">{values || "Sem combinação"} · {variant.stock - variant.reserved_stock} disponíveis</span>
                  </span>
                  <form action={deleteProductVariant}>
                    <input type="hidden" name="product_id" value={id} />
                    <input type="hidden" name="variant_id" value={variant.id} />
                    <button className="text-xs font-bold text-red-500">Excluir</button>
                  </form>
                </div>
              );
            })}
          </div>
          <form action={addProductVariant} className="mt-5 grid gap-3 border-t border-slate-100 pt-5">
            <input type="hidden" name="product_id" value={id} />
            <div className="grid grid-cols-2 gap-2">
              <input name="sku" required placeholder="SKU da variação" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              <input name="price" type="number" step="0.01" min="0" placeholder="Preço opcional" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </div>
            <input name="stock" type="number" min="0" required defaultValue={0} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              {allValues.map((value) => <label key={value.id} className="text-xs"><input type="checkbox" name="option_value_ids" value={value.id} className="mr-2 accent-sky-500" />{value.optionName}: {value.value}</label>)}
            </div>
            <label className="text-xs"><input name="active" type="checkbox" defaultChecked className="mr-2 accent-sky-500" />Variação ativa</label>
            <button className="h-10 rounded-xl bg-sky-500 text-xs font-black text-white">Adicionar variação</button>
          </form>
        </div>
      </section>
    </div>
  );
}
