import { MessageCircle } from "lucide-react";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { getStoreChromeSettings } from "@/lib/store-settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { identity, contact } = await getStoreChromeSettings();
  return (
    <div className="flex min-h-screen flex-col bg-white" style={{ "--store-primary": identity.primary, "--store-accent": identity.accent } as React.CSSProperties}>
      <StoreHeader accent={identity.accent} />
      <main className="flex-1">{children}</main>
      <StoreFooter whatsapp={contact.whatsapp} email={contact.email} instagram={contact.instagram} />
      <a
        href={`https://wa.me/${contact.whatsapp}?text=Olá!%20Preciso%20de%20ajuda%20na%20loja%20Tubarões%20UVV.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-1 hover:bg-emerald-600"
        aria-label="Falar com a Tubarões UVV pelo WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </div>
  );
}
