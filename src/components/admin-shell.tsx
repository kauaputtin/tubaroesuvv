"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Box, ExternalLink, FolderTree, LayoutTemplate, LogOut, Menu, Package, Settings, ShoppingCart, Tags, Users, X } from "lucide-react";
import { useState } from "react";
import { logoutAdmin } from "@/app/(dashboard)/admin/actions";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Visão geral", icon: BarChart3 },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/estoque", label: "Estoque", icon: Box },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/cupons", label: "Cupons", icon: Tags },
  { href: "/admin/aparencia", label: "Loja & aparência", icon: LayoutTemplate },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminShell({ children, admin }: { children: React.ReactNode; admin: { fullName: string; role: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[260px_1fr]">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-[#00162f] px-4 text-white lg:hidden"><button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button><Image src="/assets/logo-tubaroes.png" alt="Tubarões UVV" width={52} height={52} className="h-12 w-12 object-contain" /><Link href="/" target="_blank" aria-label="Visualizar loja"><ExternalLink size={20} /></Link></header>
      {open && <button className="fixed inset-0 z-50 bg-slate-950/55 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <aside className={cn("fixed inset-y-0 left-0 z-[60] flex w-[260px] flex-col bg-[#00162f] text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-24 items-center justify-between border-b border-white/10 px-5"><Link href="/admin" className="flex items-center gap-3"><Image src="/assets/logo-tubaroes.png" alt="Tubarões UVV" width={58} height={58} className="h-14 w-14 object-contain" /><span><strong className="block text-sm">Tubarões UVV</strong><span className="text-[0.62rem] uppercase tracking-widest text-sky-300">Admin</span></span></Link><button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Fechar menu"><X /></button></div>
        <nav className="scrollbar-none flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegação administrativa">{items.map((item) => { const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition", active ? "bg-sky-500 text-white shadow-lg shadow-sky-950/20" : "text-white/60 hover:bg-white/8 hover:text-white")}><item.icon size={18} />{item.label}</Link>; })}</nav>
        <div className="border-t border-white/10 p-4"><div className="mb-4"><p className="truncate text-sm font-bold">{admin.fullName}</p><p className="truncate text-xs text-white/45">{admin.role}</p></div><div className="grid grid-cols-2 gap-2"><Link href="/" target="_blank" className="flex items-center justify-center gap-2 rounded-lg bg-white/8 px-3 py-2 text-xs font-bold hover:bg-white/15"><ExternalLink size={14} /> Loja</Link><form action={logoutAdmin}><button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/8 px-3 py-2 text-xs font-bold hover:bg-white/15"><LogOut size={14} /> Sair</button></form></div></div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

