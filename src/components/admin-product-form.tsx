import type { Product } from "@/lib/types";
import { saveProduct } from "@/app/(dashboard)/admin/produtos/actions";
import { ProductImageManager, type ExistingProductImage } from "@/components/product-image-manager";
import { ProductVariationBuilder } from "@/components/product-variation-builder";

const input = "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500";

type AdminProductFormProps = {
  product?: Partial<Product> & Record<string, unknown>;
  categories?: Array<{ id: string; name: string }>;
  selectedCategory?: string;
  images?: ExistingProductImage[];
};

export function AdminProductForm({ product, categories = [], selectedCategory = "", images = [] }: AdminProductFormProps) {
  return (
    <form action={saveProduct} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 font-bold text-slate-900">Informações do produto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold">Nome</span>
              <input name="name" required defaultValue={product?.name ?? ""} className={input} />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold">Categoria</span>
              <select name="category_id" defaultValue={selectedCategory} className={input}>
                <option value="">Sem categoria</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold">Descrição completa</span>
              <textarea name="description" defaultValue={product?.description ?? ""} className="min-h-44 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-sky-500" />
            </label>
          </div>
        </section>

        {!product?.id && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <ProductVariationBuilder />
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 font-bold text-slate-900">Preço e estoque</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-1.5 block text-xs font-bold">Preço (R$)</span>
              <input name="price" type="number" step="0.01" min="0" required defaultValue={product?.price ?? 0} className={input} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold">De / promocional</span>
              <input name="compare_at_price" type="number" step="0.01" min="0" defaultValue={String(product?.compareAtPrice ?? product?.compare_at_price ?? "")} className={input} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold">Custo (R$)</span>
              <input name="cost" type="number" step="0.01" min="0" required defaultValue={product?.cost ?? 0} className={input} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold">Estoque</span>
              <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className={input} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <ProductImageManager initialImages={images} />
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 font-bold">Publicação</h2>
          <div className="space-y-4 text-sm">
            {[
              ["active", "Produto ativo", product?.active ?? true],
              ["featured", "Destacar na home", product?.featured ?? false],
              ["is_new", "Marcar como novo", product?.isNew ?? product?.is_new ?? false],
              ["allow_backorder", "Vender sem estoque", product?.allowBackorder ?? product?.allow_backorder ?? false],
            ].map(([name, label, checked]) => (
              <label key={String(name)} className="flex cursor-pointer items-center justify-between gap-4">
                <span>{String(label)}</span>
                <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} className="h-4 w-4 accent-sky-500" />
              </label>
            ))}
          </div>
          <button className="mt-6 h-12 w-full rounded-xl bg-sky-500 text-sm font-black text-white hover:bg-sky-600">Salvar produto</button>
        </section>
        {product?.id && <section className="rounded-2xl border border-sky-100 bg-sky-50 p-5 text-xs leading-5 text-sky-900">
          <strong className="block">Variações do produto</strong>
          <p className="mt-1 text-sky-800/70">Use os controles abaixo do formulário para adicionar novas opções e combinações.</p>
        </section>}
      </aside>
    </form>
  );
}
