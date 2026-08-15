import type { LucideIcon } from "lucide-react";

export function ContentPage({ eyebrow = "Tubarões UVV", title, intro, icon: Icon, children }: { eyebrow?: string; title: string; intro: string; icon?: LucideIcon; children: React.ReactNode }) {
  return <div className="bg-slate-50/70"><header className="bg-[#00162f] px-4 py-16 text-white sm:py-20"><div className="mx-auto max-w-4xl">{Icon&&<Icon className="mb-5 text-sky-400" size={34}/>}<p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">{eyebrow}</p><h1 className="font-display mt-3 text-4xl font-black uppercase sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">{intro}</p></div></header><article className="mx-auto max-w-4xl px-4 py-14 text-sm leading-7 text-slate-600 sm:px-6 sm:py-16 [&_h2]:font-display [&_h2]:mt-9 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:text-[#001b3b] [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</article></div>;
}

