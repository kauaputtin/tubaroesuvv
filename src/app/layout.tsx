import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/providers/cart-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Tubarões UVV | Loja Oficial",
    template: "%s | Tubarões UVV",
  },
  description: "Loja oficial da Atlética Tubarões UVV. Mantos, acessórios e produtos para quem faz parte desse cardume.",
  openGraph: {
    title: "Tubarões UVV | Loja Oficial",
    description: "Vista a força do cardume.",
    type: "website",
    locale: "pt_BR",
    images: ["/assets/hero-ocean.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
