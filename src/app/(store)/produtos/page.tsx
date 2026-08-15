import type { Metadata } from "next";
import { CatalogGrid } from "@/components/catalog-grid";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Loja", description: "Conheça todos os produtos oficiais da Atlética Tubarões UVV." };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ promocao?: string; q?: string }> }) {
  const params = await searchParams;
  const products = await getCatalogProducts();
  return (
    <div className="bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Loja oficial</p>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-[#001b3b] sm:text-5xl">Produtos do cardume</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">Mantos, acessórios e itens oficiais para representar a Tubarões UVV em qualquer lugar.</p>
        </div>
        <CatalogGrid products={products.filter((product) => product.active)} initialQuery={params.q ?? ""} onlySale={params.promocao === "true"} />
      </div>
    </div>
  );
}
