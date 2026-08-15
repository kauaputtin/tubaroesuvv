"use client";
import { AlertTriangle } from "lucide-react";
export default function StoreError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="mx-auto max-w-xl px-4 py-24 text-center"><AlertTriangle size={48} className="mx-auto text-amber-500"/><h1 className="font-display mt-5 text-4xl font-black uppercase text-[#001b3b]">A maré virou</h1><p className="mt-3 text-sm text-slate-500">Não conseguimos carregar esta página agora.</p><button onClick={reset} className="mt-6 rounded-xl bg-sky-500 px-6 py-3 text-sm font-black text-white">Tentar novamente</button></div>}

