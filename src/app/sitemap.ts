import type { MetadataRoute } from "next";
import { getCatalogProducts } from "@/lib/catalog";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";const products=await getCatalogProducts();const staticPaths=["","/produtos","/quem-somos","/contato","/politica-de-privacidade","/politica-de-entrega","/trocas-e-devolucoes","/termos-de-uso"];return [...staticPaths.map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path===""?"daily" as const:"monthly" as const,priority:path===""?1:.6})),...products.map(product=>({url:`${base}/produto/${product.slug}`,lastModified:new Date(),changeFrequency:"weekly" as const,priority:.8}))]}

