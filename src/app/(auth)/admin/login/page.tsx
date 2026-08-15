import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Acesso administrativo", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="grid min-h-screen bg-[#00162f] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:block"><Image src="/assets/hero-ocean.png" alt="Oceano Tubarões UVV" fill priority className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#00162f]/30 to-[#00162f]" /><div className="absolute bottom-16 left-16 max-w-md text-white"><p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">Central de comando</p><h1 className="font-display mt-3 text-5xl font-black uppercase leading-none">Tudo da loja.<br />Em um só lugar.</h1></div></section>
      <section className="flex items-center justify-center px-5 py-16"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-10"><Link href="/" className="inline-flex"><Image src="/assets/logo-tubaroes.png" alt="Tubarões UVV" width={76} height={76} /></Link><p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-sky-600">Painel administrativo</p><h2 className="font-display mt-2 text-4xl font-black uppercase text-[#001b3b]">Bem-vindo de volta</h2><p className="mt-3 text-sm leading-6 text-slate-500">Entre com sua conta administrativa do Supabase.</p><AdminLoginForm /><p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} /> Acesso protegido e auditado</p></div></section>
    </main>
  );
}

