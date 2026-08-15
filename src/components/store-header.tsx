"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { StoreLogo } from "@/components/store-logo";
import { useCart } from "@/components/providers/cart-provider";

const navigation = [
  { href: "/produtos", label: "Loja" },
  { href: "/categoria/roupas", label: "Roupas" },
  { href: "/categoria/tirantes", label: "Tirantes" },
  { href: "/quem-somos", label: "Quem somos" },
];

export function StoreHeader({ accent = "#0a87f5" }: { accent?: string }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--store-primary)]/95 text-white backdrop-blur-xl">
      <div style={{ backgroundColor: accent }} className="px-4 py-2 text-center text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
        Retirada gratuita na UVV • Pagamento seguro via PIX ou cartão
      </div>
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-full p-2 text-white lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
        <StoreLogo />
        <nav className="ml-4 hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-white/75 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/busca" className="ml-auto hidden w-full max-w-sm md:block">
          <label className="relative block">
            <span className="sr-only">Buscar produtos</span>
            <input
              type="search"
              name="q"
              placeholder="O que você procura?"
              className="h-11 w-full rounded-full border border-white/15 bg-white/10 pl-5 pr-12 text-sm text-white outline-none placeholder:text-white/45 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60" size={19} />
          </label>
        </form>
        <Link
          href="/carrinho"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label={`Carrinho com ${count} itens`}
        >
          <ShoppingBag size={21} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[0.65rem] font-black text-white">
              {count}
            </span>
          )}
        </Link>
      </div>
      {open && (
        <div className="border-t border-white/10 px-4 pb-5 pt-3 lg:hidden">
          <form action="/busca" className="mb-3 md:hidden">
            <input
              type="search"
              name="q"
              placeholder="Buscar produtos"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/50"
            />
          </form>
          <nav className="grid gap-1" aria-label="Menu móvel">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-white/10">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
