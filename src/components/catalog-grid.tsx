"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

export function CatalogGrid({
  products,
  initialQuery = "",
  initialCategory = "",
  onlySale = false,
}: {
  products: Product[];
  initialQuery?: string;
  initialCategory?: string;
  onlySale?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");
  const [saleOnly, setSaleOnly] = useState(onlySale);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return products
      .filter((product) => !normalized || `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase("pt-BR").includes(normalized))
      .filter((product) => !category || product.categorySlug === category)
      .filter((product) => !saleOnly || product.compareAtPrice)
      .sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "new") return Number(b.isNew) - Number(a.isNew);
        return Number(b.featured) - Number(a.featured);
      });
  }, [category, products, query, saleOnly, sort]);

  return (
    <div>
      <div className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
        <label>
          <span className="sr-only">Buscar no catálogo</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no catálogo..."
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500" aria-label="Filtrar por categoria">
          <option value="">Todas as categorias</option>
          <option value="roupas">Roupas</option>
          <option value="acessorios">Acessórios</option>
          <option value="tirantes">Tirantes</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500" aria-label="Ordenar produtos">
          <option value="featured">Em destaque</option>
          <option value="new">Lançamentos</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500"><strong className="text-slate-900">{filtered.length}</strong> {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}</p>
        <button type="button" onClick={() => setSaleOnly((value) => !value)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${saleOnly ? "border-sky-500 bg-sky-500 text-white" : "border-slate-200 text-slate-600 hover:border-sky-400"}`}>
          <SlidersHorizontal size={14} /> Em promoção {saleOnly && <X size={13} />}
        </button>
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-20 text-center">
          <p className="font-bold text-slate-900">Nenhum produto mergulhou por aqui.</p>
          <p className="mt-2 text-sm text-slate-500">Tente remover os filtros ou buscar outro termo.</p>
          <button type="button" onClick={() => { setQuery(""); setCategory(""); setSaleOnly(false); }} className="mt-5 text-sm font-bold text-sky-600">Limpar filtros</button>
        </div>
      )}
    </div>
  );
}

