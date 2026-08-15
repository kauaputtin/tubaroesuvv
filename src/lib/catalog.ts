import "server-only";
import { unstable_cache } from "next/cache";
import { categories as fallbackCategories, products as fallbackProducts } from "@/lib/products";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { Product } from "@/lib/types";

export type CatalogCategory = { name: string; slug: string; description: string; image: string };

const getCachedCatalogProducts = unstable_cache(async (): Promise<Product[]> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return fallbackProducts;
  const { data, error } = await supabase
    .from("products")
    .select("*,product_categories(categories(name,slug)),product_images(url,sort_order),product_options(name,required,sort_order,product_option_values(value,sort_order)),product_variants(id,sku,price,stock,reserved_stock,image_url,active,variant_option_values(product_option_values(value,product_options(name))))")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error || !data?.length) return fallbackProducts;

  return data.map((row) => {
    const categoryRelation = row.product_categories as unknown as Array<{ categories: { name: string; slug: string } | null }>;
    const category = categoryRelation?.[0]?.categories;
    const images = (row.product_images as unknown as Array<{ url: string; sort_order: number }> ?? []).sort((a, b) => a.sort_order - b.sort_order).map((image) => image.url);
    const options = (row.product_options as unknown as Array<{ name: string; required: boolean; sort_order: number; product_option_values: Array<{ value: string; sort_order: number }> }> ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => ({ name: option.name, required: option.required, values: option.product_option_values.sort((a, b) => a.sort_order - b.sort_order).map((value) => value.value) }));
    const variants = (row.product_variants as unknown as Array<{ id:string;sku:string;price:number|null;stock:number;reserved_stock:number;image_url:string|null;active:boolean;variant_option_values:Array<{product_option_values:{value:string;product_options:{name:string}}}> }> ?? []).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price === null ? undefined : Number(variant.price),
      stock: variant.stock - variant.reserved_stock,
      image: variant.image_url ?? undefined,
      active: variant.active,
      options: Object.fromEntries(variant.variant_option_values.map((relation) => [relation.product_option_values.product_options.name, relation.product_option_values.value])),
    }));
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.short_description ?? "",
      description: row.description ?? "",
      category: category?.name ?? "Produtos",
      categorySlug: category?.slug ?? "produtos",
      image: row.main_image_url || images[0] || "/products/camisa-i-2025.jpg",
      gallery: images.length ? images : [row.main_image_url || "/products/camisa-i-2025.jpg"],
      price: Number(row.price),
      compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
      cost: Number(row.cost),
      sku: row.sku,
      stock: row.stock - row.reserved_stock,
      minimumStock: row.minimum_stock,
      active: row.active,
      featured: row.featured,
      isNew: row.is_new,
      allowBackorder: row.allow_backorder,
      options,
      variants,
      weightGrams: row.weight_grams,
    } satisfies Product;
  });
}, ["catalog-products-v1"], { revalidate: 60, tags: ["catalog-products"] });

export function getCatalogProducts(): Promise<Product[]> {
  return getCachedCatalogProducts();
}

export async function getCatalogProductBySlug(slug: string) {
  return (await getCatalogProducts()).find((product) => product.slug === slug);
}

const getCachedCatalogCategories = unstable_cache(async (): Promise<CatalogCategory[]> => {
  const supabase = createSupabasePublicClient();
  if (!supabase) return [...fallbackCategories];
  const { data, error } = await supabase.from("categories").select("name,slug,description,image_url").eq("active", true).order("sort_order");
  if (error || !data?.length) return [...fallbackCategories];
  return data.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image: category.image_url || fallbackCategories.find((fallback) => fallback.slug === category.slug)?.image || "/products/camisa-i-2025.jpg",
  }));
}, ["catalog-categories-v1"], { revalidate: 60, tags: ["catalog-categories"] });

export function getCatalogCategories(): Promise<CatalogCategory[]> {
  return getCachedCatalogCategories();
}
