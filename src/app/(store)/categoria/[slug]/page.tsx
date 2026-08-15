import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogGrid } from "@/components/catalog-grid";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCatalogCategories();
  const category = categories.find((item) => item.slug === slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [categories, products] = await Promise.all([getCatalogCategories(), getCatalogProducts()]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return (
    <div className="bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-sky-600">Categoria</p>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-[#001b3b] sm:text-5xl">{category.name}</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">{category.description}</p>
        </div>
        <CatalogGrid products={products.filter((product) => product.active)} initialCategory={slug} />
      </div>
    </div>
  );
}
