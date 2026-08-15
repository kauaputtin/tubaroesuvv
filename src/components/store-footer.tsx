import Image from "next/image";
import Link from "next/link";
import { Camera, Mail, MapPin, MessageCircle } from "lucide-react";

export function StoreFooter({ whatsapp = "5527999999999", email = "contato@tubaroesuvv.com.br", instagram = "tubaroesuvv" }: { whatsapp?: string; email?: string; instagram?: string }) {
  return (
    <footer className="mt-auto bg-[color:var(--store-primary)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Image src="/assets/logo-tubaroes.png" alt="Tubarões UVV" width={84} height={84} className="mb-4 h-20 w-20 object-contain" />
          <p className="max-w-xs text-sm leading-6 text-white/60">Produtos oficiais da Atlética Tubarões UVV. Feito por estudantes, para estudantes.</p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Loja</h2>
          <div className="grid gap-3 text-sm text-white/60">
            <Link href="/produtos">Todos os produtos</Link>
            <Link href="/categoria/roupas">Roupas</Link>
            <Link href="/categoria/acessorios">Acessórios</Link>
            <Link href="/acompanhar-pedido">Acompanhar pedido</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Institucional</h2>
          <div className="grid gap-3 text-sm text-white/60">
            <Link href="/quem-somos">Quem somos</Link>
            <Link href="/politica-de-privacidade">Privacidade</Link>
            <Link href="/politica-de-entrega">Entrega e retirada</Link>
            <Link href="/trocas-e-devolucoes">Trocas e devoluções</Link>
            <Link href="/termos-de-uso">Termos de uso</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Fale com a gente</h2>
          <div className="grid gap-3 text-sm text-white/60">
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2"><MessageCircle size={17} /> WhatsApp</a>
            <a href={`mailto:${email}`} className="flex items-center gap-2"><Mail size={17} /> {email}</a>
            <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2"><Camera size={17} /> @{instagram}</a>
            <span className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0" /> Vila Velha, ES</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Atlética Tubarões UVV. Todos os direitos reservados.
      </div>
    </footer>
  );
}
