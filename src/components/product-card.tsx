import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/8">
      <Link href={`/produto/${product.slug}`} className="relative aspect-square overflow-hidden bg-slate-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.isNew && <span className="rounded-full bg-[#001b3b] px-3 py-1 text-[0.62rem] font-black uppercase tracking-wider text-white">Novo</span>}
          {discount > 0 && <span className="rounded-full bg-sky-500 px-3 py-1 text-[0.62rem] font-black uppercase tracking-wider text-white">-{discount}%</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-sky-600">{product.category}</p>
        <Link href={`/produto/${product.slug}`} className="line-clamp-2 min-h-12 font-bold leading-6 text-slate-900 hover:text-sky-600">
          {product.name}
        </Link>
        <div className="mt-3 flex items-end gap-2">
          <strong className="text-lg font-black text-[#001b3b]">{formatCurrency(product.price)}</strong>
          {product.compareAtPrice && <span className="pb-0.5 text-sm text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</span>}
        </div>
        <p className="mb-4 mt-1 text-xs text-slate-500">ou em até 3x sem juros</p>
        <div className="mt-auto"><AddToCart product={product} compact={product.options.length === 0} /></div>
      </div>
    </article>
  );
}

