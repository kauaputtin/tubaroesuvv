"use client";

import { LockKeyhole, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/(auth)/admin/login/actions";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">E-mail</span><input name="email" type="email" required autoComplete="email" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" placeholder="admin@tubaroesuvv.com.br" /></label>
      <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Senha</span><input name="password" type="password" required minLength={8} autoComplete="current-password" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" placeholder="••••••••" /></label>
      {state.error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p>}
      <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 text-sm font-black text-white transition hover:bg-sky-600 disabled:opacity-70">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <LockKeyhole size={18} />}{pending ? "Entrando..." : "Entrar no painel"}</button>
    </form>
  );
}

