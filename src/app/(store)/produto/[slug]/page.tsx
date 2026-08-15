import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin, RotateCcw, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/catalog";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  return product ? { title: product.name, description: product.shortDescription, openGraph: { images: [product.image] } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();
  const products = await getCatalogProducts();
  const related = products.filter((item) => item.categorySlug === product.categorySlug && item.id !== product.id).slice(0, 4);
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-hidden text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/">Início</Link><ChevronRight size={13} /><Link href="/produtos">Produtos</Link><ChevronRight size={13} /><span className="truncate text-slate-800">{product.name}</span>
        </nav>
      </div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100">
          <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          <div className="absolute left-5 top-5 flex gap-2">
            {product.isNew && <span className="rounded-full bg-[#001b3b] px-4 py-2 text-[0.65rem] font-black uppercase tracking-wider text-white">Novo</span>}
            {discount > 0 && <span className="rounded-full bg-sky-500 px-4 py-2 text-[0.65rem] font-black uppercase tracking-wider text-white">-{discount}%</span>}
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">{product.category}</p>
          <h1 className="font-display mt-3 text-4xl font-black uppercase leading-[0.95] tracking-tight text-[#001b3b] sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-base leading-7 text-slate-600">{product.shortDescription}</p>
          <div className="mt-7 flex items-end gap-3 border-y border-slate-200 py-6">
            <strong className="text-3xl font-black text-[#001b3b]">{formatCurrency(product.price)}</strong>
            {product.compareAtPrice && <span className="pb-1 text-base text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</span>}
          </div>
          <p className="mt-3 text-sm text-slate-500">Em até 3x de {formatCurrency(product.price / 3)} sem juros</p>
          <div className="mt-8"><AddToCart product={product} /></div>
          <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <span className="flex items-center gap-2"><MapPin size={17} className="text-sky-500" /> Retirada grátis</span>
            <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-sky-500" /> Compra segura</span>
            <span className="flex items-center gap-2"><RotateCcw size={17} className="text-sky-500" /> Troca facilitada</span>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_0.45fr] lg:px-8">
          <div><h2 className="font-display text-2xl font-black uppercase text-[#001b3b]">Sobre o produto</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{product.description}</p></div>
          <div className="rounded-2xl bg-white p-6"><h2 className="text-sm font-black uppercase text-[#001b3b]">Detalhes</h2><dl className="mt-4 grid gap-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">SKU</dt><dd className="font-semibold">{product.sku}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Estoque</dt><dd className="font-semibold">{product.stock} unidades</dd></div><div className="flex justify-between"><dt className="text-slate-500">Peso</dt><dd className="font-semibold">{product.weightGrams} g</dd></div></dl></div>
        </div>
      </section>
      {related.length > 0 && <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><h2 className="font-display mb-8 text-3xl font-black uppercase text-[#001b3b]">Você também pode gostar</h2><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  );
}
