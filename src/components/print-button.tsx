"use client";
import { Printer } from "lucide-react";
export function PrintButton(){return <button type="button" onClick={()=>window.print()} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold print:hidden"><Printer size={15}/> Imprimir</button>}
