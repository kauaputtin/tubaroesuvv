import Link from "next/link";
export default function NotFound(){return <main className="flex min-h-screen items-center justify-center bg-[#00162f] px-4 text-center text-white"><div><p className="font-display text-8xl font-black text-sky-400">404</p><h1 className="font-display mt-3 text-4xl font-black uppercase">Nada por essas águas</h1><p className="mt-3 text-sm text-white/55">A página que você procurou não foi encontrada.</p><Link href="/" className="mt-7 inline-flex rounded-xl bg-sky-500 px-6 py-3 text-sm font-black">Voltar ao início</Link></div></main>}

