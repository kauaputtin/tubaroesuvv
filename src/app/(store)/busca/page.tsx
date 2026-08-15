import type { Metadata } from "next";
import { CatalogGrid } from "@/components/catalog-grid";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Busca" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const products = await getCatalogProducts();
  return (
    <div className="bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Resultado da busca</p>
        <h1 className="font-display mb-10 text-4xl font-black uppercase tracking-tight text-[#001b3b] sm:text-5xl">{q ? `Busca por “${q}”` : "Encontre seu produto"}</h1>
        <CatalogGrid products={products.filter((product) => product.active)} initialQuery={q} />
      </div>
    </div>
  );
}
