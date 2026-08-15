import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, MapPin, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";

export default async function HomePage() {
  const [products, categories] = await Promise.all([getCatalogProducts(), getCatalogCategories()]);
  const featured = products.filter((product) => product.featured).slice(0, 4);
  const offers = products.filter((product) => product.compareAtPrice);

  return (
    <>
      <section className="relative isolate min-h-[650px] overflow-hidden bg-[#00162f] text-white sm:min-h-[700px]">
        <Image src="/assets/hero-ocean.png" alt="Barbatana de tubarão atravessando o oceano azul" fill priority sizes="100vw" className="object-cover object-[68%_center] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#00162f] via-[#00162f]/90 to-[#00162f]/10" />
        <div className="ocean-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-4 py-20 sm:min-h-[700px] sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              <Sparkles size={14} /> Loja oficial da atlética
            </div>
            <h1 className="font-display text-5xl font-black uppercase leading-[0.88] tracking-[-0.05em] sm:text-7xl lg:text-[6.6rem]">
              Vista a <br className="sm:hidden" />força<br /><span className="text-sky-400">do cardume.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Produtos oficiais Tubarões UVV para quem carrega a energia da atlética dentro e fora do campus.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/produtos" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-sky-500 px-7 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-400">
                Explorar a loja <ArrowRight size={18} />
              </Link>
              <Link href="/categoria/roupas" className="inline-flex h-13 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/10">
                Ver os mantos
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="relative z-10 mx-auto -mt-9 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Benefícios da compra">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/8 sm:grid-cols-3">
          {[
            { icon: MapPin, title: "Retirada na UVV", text: "Sem taxa, no ponto combinado" },
            { icon: ShieldCheck, title: "Compra protegida", text: "Checkout seguro e dados protegidos" },
            { icon: CreditCard, title: "PIX ou cartão", text: "Pague do jeito que preferir" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 border-b border-slate-100 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><item.icon size={21} /></span>
              <span><strong className="block text-sm text-slate-900">{item.title}</strong><span className="text-xs text-slate-500">{item.text}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div><p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Escolha seu território</p><h2 className="font-display text-3xl font-black uppercase tracking-tight text-[#001b3b] sm:text-4xl">Compre por categoria</h2></div>
          <Link href="/produtos" className="hidden items-center gap-2 text-sm font-bold text-sky-600 sm:flex">Ver tudo <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((category, index) => (
            <Link key={category.slug} href={`/categoria/${category.slug}`} className="group relative min-h-80 overflow-hidden rounded-2xl bg-slate-900">
              <Image src={category.image} alt={category.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-65 transition duration-700 group-hover:scale-105 group-hover:opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00162f] via-[#00162f]/15 to-transparent" />
              <span className="absolute left-6 top-5 text-xs font-black text-white/50">0{index + 1}</span>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <h3 className="font-display text-3xl font-black uppercase">{category.name}</h3>
                <p className="mt-1 text-sm text-white/65">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex items-end justify-between gap-6">
            <div><p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Os mais procurados</p><h2 className="font-display text-3xl font-black uppercase tracking-tight text-[#001b3b] sm:text-4xl">Destaques do cardume</h2></div>
            <Link href="/produtos" className="hidden items-center gap-2 text-sm font-bold text-sky-600 sm:flex">Ver todos <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#00162f] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:px-8 lg:py-24">
          <div>
            <span className="mb-5 inline-flex rounded-full bg-sky-500 px-4 py-2 text-xs font-black uppercase tracking-wider">Ofertas da maré</span>
            <h2 className="font-display text-4xl font-black uppercase leading-none sm:text-6xl">Preços que<br />mergulharam.</h2>
            <p className="mt-5 max-w-md text-white/60">Aproveite os itens promocionais enquanto ainda estão na superfície.</p>
            <Link href="/produtos?promocao=true" className="mt-8 inline-flex items-center gap-2 border-b border-sky-400 pb-1 text-sm font-black uppercase tracking-wider text-sky-300">Ver promoções <ArrowRight size={17} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">{offers.slice(0, 2).map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Sem dúvida na compra</p>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-[#001b3b] sm:text-4xl">Perguntas frequentes</h2>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {[
              ["Como funciona a retirada na UVV?", "Após a confirmação do pagamento, avisamos pelo WhatsApp quando o pedido estiver pronto e combinamos o ponto de retirada no campus."],
              ["Posso trocar o tamanho?", "Sim. A solicitação pode ser feita em até 7 dias após o recebimento, desde que o produto esteja sem uso e com a etiqueta."],
              ["O pagamento por PIX confirma na hora?", "Normalmente em poucos segundos. A página de pagamento acompanha a confirmação automaticamente."],
              ["Vocês entregam fora de Vila Velha?", "Sim. No checkout, escolha envio para endereço e informe o CEP para ver as opções disponíveis."],
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900"><span>{question}</span><span className="text-xl text-sky-500 transition group-open:rotate-45">+</span></summary>
                <p className="max-w-xl pt-3 text-sm leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-sky-50 p-8 sm:p-12">
          <Truck className="text-sky-500" size={38} />
          <h2 className="font-display mt-7 text-4xl font-black uppercase leading-none text-[#001b3b]">Do nosso cardume<br />para o seu.</h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-600">Cadastre seu e-mail e receba primeiro os novos drops, reposições e ações exclusivas da atlética.</p>
          <form action="/api/newsletter" method="post" className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">Seu melhor e-mail</label>
            <input id="newsletter-email" name="email" type="email" required placeholder="Seu melhor e-mail" className="h-12 min-w-0 flex-1 rounded-xl border border-sky-100 bg-white px-4 text-sm outline-none focus:border-sky-500" />
            <button className="h-12 rounded-xl bg-[#001b3b] px-6 text-sm font-black text-white transition hover:bg-sky-600">Quero entrar</button>
          </form>
        </div>
      </section>
    </>
  );
}
