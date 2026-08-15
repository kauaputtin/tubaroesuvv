"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const productSchema = z.object({
  id: z.string().optional(),
  category_id: z.union([z.literal(""), z.uuid()]).optional(),
  name: z.string().trim().min(3),
  description: z.string().trim().optional(),
  price: z.coerce.number().min(0),
  compare_at_price: z.union([z.literal(""), z.coerce.number().min(0)]).optional(),
  cost: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  active: z.boolean(), featured: z.boolean(), is_new: z.boolean(), allow_backorder: z.boolean(),
});

function invalidateProductCatalog() {
  updateTag("catalog-products");
}

function slugifyProductName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "produto";
}

function createProductSku() {
  return `TUVV-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

const productImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const productOptionsSchema = z.array(z.object({
  name: z.string().trim().min(2).max(40),
  values: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  required: z.boolean(),
})).max(5);

function readProductOptions(formData: FormData) {
  const raw = formData.get("product_options");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const options = productOptionsSchema.parse(JSON.parse(raw)).map((option) => ({
      ...option,
      values: [...new Map(option.values.map((value) => [value.toLocaleLowerCase("pt-BR"), value])).values()],
    }));
    if (new Set(options.map((option) => option.name.toLocaleLowerCase("pt-BR"))).size !== options.length) throw new Error();
    return options;
  } catch {
    throw new Error("Revise as variações: cada grupo precisa de um nome e ao menos uma opção.");
  }
}

function readImageField(formData: FormData, name: string) {
  const raw = formData.get(name);
  if (typeof raw !== "string") return [];
  try {
    return z.array(z.string()).max(10).parse(JSON.parse(raw));
  } catch {
    throw new Error("A lista de imagens é inválida. Atualize a página e tente novamente.");
  }
}

function storagePathFromImageUrl(url: string) {
  const marker = "/storage/v1/object/public/product-images/";
  const start = url.indexOf(marker);
  if (start < 0) return null;
  return decodeURIComponent(url.slice(start + marker.length));
}

export async function saveProduct(formData: FormData) {
  const admin = await requireAdmin("products.manage");
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse({ ...raw, active: formData.has("active"), featured: formData.has("featured"), is_new: formData.has("is_new"), allow_backorder: formData.has("allow_backorder") });
  if (!parsed.success) throw new Error("Dados do produto inválidos. Verifique o nome e os valores informados.");
  const productOptions = readProductOptions(formData);
  const imageFiles = formData.getAll("image_files").filter((value): value is File => value instanceof File && value.size > 0);
  const imageOrder = readImageField(formData, "image_order");
  const existingImageIds = readImageField(formData, "existing_image_ids");
  const newImageIds = readImageField(formData, "new_image_ids");
  const validExistingIds = z.array(z.union([z.literal("legacy"), z.uuid()])).max(10).safeParse(existingImageIds);
  const validNewIds = z.array(z.uuid()).max(10).safeParse(newImageIds);
  if (!validExistingIds.success || !validNewIds.success || new Set(existingImageIds).size !== existingImageIds.length || new Set(newImageIds).size !== newImageIds.length) throw new Error("A lista de imagens é inválida.");
  if (newImageIds.length !== imageFiles.length) throw new Error("Não foi possível relacionar as imagens selecionadas.");
  if (existingImageIds.length + imageFiles.length > 10) throw new Error("Cada produto pode ter no máximo 10 imagens.");
  for (const imageFile of imageFiles) {
    if (!productImageTypes.has(imageFile.type)) throw new Error("Use somente imagens JPG, PNG, WebP ou AVIF.");
    if (imageFile.size > 5 * 1024 * 1024) throw new Error("Cada imagem deve ter no máximo 5 MB.");
  }
  const expectedOrder = [
    ...existingImageIds.map((imageId) => `existing:${imageId}`),
    ...newImageIds.map((imageId) => `new:${imageId}`),
  ];
  if (imageOrder.length !== expectedOrder.length || new Set(imageOrder).size !== imageOrder.length || expectedOrder.some((token) => !imageOrder.includes(token))) throw new Error("A ordem das imagens é inválida.");

  const { id, category_id, compare_at_price, ...values } = parsed.data;
  const supabase = (await createSupabaseServerClient())!;

  const existingRows: Array<{ id: string; url: string }> = [];
  let legacyImageUrl: string | null = null;
  if (id) {
    const [{ data: product, error: productError }, { data: images, error: imagesError }] = await Promise.all([
      supabase.from("products").select("main_image_url").eq("id", id).maybeSingle(),
      supabase.from("product_images").select("id,url").eq("product_id", id),
    ]);
    if (productError || imagesError) throw new Error(productError?.message || imagesError?.message);
    if (!product) throw new Error("Produto não encontrado.");
    existingRows.push(...(images ?? []));
    if (!existingRows.length && product.main_image_url) legacyImageUrl = product.main_image_url;
  } else if (existingImageIds.length) {
    throw new Error("Um produto novo não pode receber referências de imagens antigas.");
  }

  const existingById = new Map(existingRows.map((image) => [image.id, image.url]));
  if (legacyImageUrl) existingById.set("legacy", legacyImageUrl);
  if (existingImageIds.some((imageId) => !existingById.has(imageId))) throw new Error("Uma das imagens existentes não pertence a este produto.");

  let generatedFields = {};
  if (!id) {
    const slugBase = slugifyProductName(values.name);
    const { data: existingSlug, error: slugError } = await supabase.from("products").select("id").eq("slug", slugBase).maybeSingle();
    if (slugError) throw new Error(slugError.message);
    generatedFields = {
      slug: existingSlug ? `${slugBase}-${randomUUID().slice(0, 8)}` : slugBase,
      sku: createProductSku(),
      minimum_stock: 0,
      weight_grams: 0,
    };
  }

  const uploadedImages = new Map<string, { url: string; path: string }>();
  for (const [index, imageFile] of imageFiles.entries()) {
    const imageId = newImageIds[index];
    const extension = productImageTypes.get(imageFile.type)!;
    const path = `products/${slugifyProductName(values.name)}-${imageId}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, imageFile, { cacheControl: "3600", contentType: imageFile.type, upsert: false });
    if (uploadError) {
      const uploadedPaths = [...uploadedImages.values()].map((image) => image.path);
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
      throw new Error(`Não foi possível enviar as imagens: ${uploadError.message}`);
    }
    uploadedImages.set(imageId, { path, url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl });
  }

  const orderedImages = imageOrder.map((token) => {
    const [kind, imageId] = token.split(":", 2) as ["existing" | "new", string];
    if (kind === "existing") return { kind, id: imageId, url: existingById.get(imageId)! };
    return { kind, id: imageId, url: uploadedImages.get(imageId)!.url };
  });
  const payload = {
    ...values,
    short_description: null,
    main_image_url: orderedImages[0]?.url ?? null,
    compare_at_price: compare_at_price === "" ? null : compare_at_price,
    ...generatedFields,
  };
  const result = id ? await supabase.from("products").update(payload).eq("id", id).select("id").single() : await supabase.from("products").insert(payload).select("id").single();
  if (result.error || !result.data) {
    const uploadedPaths = [...uploadedImages.values()].map((image) => image.path);
    if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
    throw new Error(result.error?.message ?? "Não foi possível salvar o produto.");
  }
  const productId = result.data.id;

  const keptExistingIds = new Set(existingImageIds.filter((imageId) => imageId !== "legacy"));
  const removedImages = existingRows.filter((image) => !keptExistingIds.has(image.id));
  if (removedImages.length) {
    const { error: deleteImagesError } = await supabase.from("product_images").delete().in("id", removedImages.map((image) => image.id));
    if (deleteImagesError) throw new Error(deleteImagesError.message);
  }
  for (const [index, image] of orderedImages.entries()) {
    if (image.kind === "existing" && image.id !== "legacy") {
      const { error: updateImageError } = await supabase.from("product_images").update({ sort_order: index, is_primary: index === 0, alt_text: values.name }).eq("id", image.id).eq("product_id", productId);
      if (updateImageError) throw new Error(updateImageError.message);
    }
  }
  const newImageRows = orderedImages.flatMap((image, index) => image.kind === "new" || image.id === "legacy" ? [{ product_id: productId, url: image.url, alt_text: values.name, sort_order: index, is_primary: index === 0 }] : []);
  if (newImageRows.length) {
    const { error: insertImagesError } = await supabase.from("product_images").insert(newImageRows);
    if (insertImagesError) throw new Error(insertImagesError.message);
  }

  async function rollbackNewProduct(message: string): Promise<never> {
    if (!id) {
      await supabase.from("products").delete().eq("id", productId);
      const uploadedPaths = [...uploadedImages.values()].map((image) => image.path);
      if (uploadedPaths.length) await supabase.storage.from("product-images").remove(uploadedPaths);
    }
    throw new Error(message);
  }

  if (!id && productOptions.length) {
    for (const [optionIndex, option] of productOptions.entries()) {
      const { data: createdOption, error: optionError } = await supabase.from("product_options").insert({
        product_id: productId,
        name: option.name,
        required: option.required,
        sort_order: optionIndex,
      }).select("id").single();
      if (optionError || !createdOption) await rollbackNewProduct(optionError?.message ?? "Não foi possível criar a variação.");
      const optionId = createdOption!.id;
      const { error: valuesError } = await supabase.from("product_option_values").insert(option.values.map((value, valueIndex) => ({
        option_id: optionId,
        value,
        sort_order: valueIndex,
      })));
      if (valuesError) await rollbackNewProduct(valuesError.message);
    }
  }

  const removedUrls = removedImages.map((image) => image.url);
  if (legacyImageUrl && !existingImageIds.includes("legacy")) removedUrls.push(legacyImageUrl);
  const removedStoragePaths = removedUrls.map(storagePathFromImageUrl).filter((path): path is string => Boolean(path));
  if (removedStoragePaths.length) await supabase.storage.from("product-images").remove(removedStoragePaths);

  await supabase.from("product_categories").delete().eq("product_id", productId);
  if (category_id) {
    const { error: categoryError } = await supabase.from("product_categories").insert({ product_id: productId, category_id });
    if (categoryError) throw new Error(categoryError.message);
  }
  await supabase.from("audit_logs").insert({ actor_id: admin.userId, action: id ? "product.update" : "product.create", entity_type: "product", entity_id: productId, new_data: payload });
  invalidateProductCatalog();
  revalidatePath("/admin/produtos"); revalidatePath("/produtos");
  redirect("/admin/produtos");
}

export async function duplicateProduct(formData: FormData) {
  const admin = await requireAdmin("products.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const supabase = (await createSupabaseServerClient())!;
  const { data: source, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  const copy = Object.fromEntries(Object.entries(source).filter(([key]) => !["id", "created_at", "updated_at"].includes(key)));
  const suffix = Date.now().toString().slice(-6);
  const { data: created, error: createError } = await supabase.from("products").insert({ ...copy, name: `${copy.name} (cópia)`, slug: `${copy.slug}-copia-${suffix}`, sku: `${copy.sku}-C${suffix}`, active: false }).select("id").single();
  if (createError) throw new Error(createError.message);
  await supabase.from("audit_logs").insert({ actor_id: admin.userId, action: "product.duplicate", entity_type: "product", entity_id: created.id, previous_data: { source_id: id } });
  invalidateProductCatalog();
  revalidatePath("/admin/produtos");
}

export async function archiveProduct(formData: FormData) {
  const admin = await requireAdmin("products.manage");
  const id = z.string().min(1).parse(formData.get("id"));
  const supabase = (await createSupabaseServerClient())!;
  const { error } = await supabase.from("products").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_logs").insert({ actor_id: admin.userId, action: "product.archive", entity_type: "product", entity_id: id });
  invalidateProductCatalog();
  revalidatePath("/admin/produtos"); revalidatePath("/produtos");
}

export async function importProductsCsv(formData: FormData) {
  const admin = await requireAdmin("products.manage");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 2_000_000) throw new Error("Envie um CSV de até 2 MB.");
  const [headerLine, ...lines] = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((value) => value.trim());
  const required = ["name","slug","sku","price","stock"];
  if (!required.every((field) => headers.includes(field))) throw new Error(`O CSV precisa conter: ${required.join(", ")}.`);
  const rows = lines.slice(0, 500).map((line) => { const values = line.split(","); const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])); return { name: row.name, slug: row.slug, sku: row.sku, price: Number(row.price), stock: Number(row.stock), cost: Number(row.cost || 0), minimum_stock: Number(row.minimum_stock || 0), main_image_url: row.main_image_url || "/products/camisa-i-2025.jpg", active: row.active !== "false" }; });
  const supabase = (await createSupabaseServerClient())!;
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "sku" });
  if (error) throw new Error(error.message);
  await supabase.from("audit_logs").insert({ actor_id: admin.userId, action: "products.import_csv", entity_type: "product", new_data: { rows: rows.length } });
  invalidateProductCatalog();
  revalidatePath("/admin/produtos");
}

export async function addProductOption(formData: FormData) {
  await requireAdmin("products.manage");
  const parsed = z.object({ product_id: z.string().min(1), name: z.string().trim().min(2), values: z.string().trim().min(1), required: z.boolean() }).parse({ ...Object.fromEntries(formData.entries()), required: formData.has("required") });
  const values = [...new Set(parsed.values.split(",").map((value) => value.trim()).filter(Boolean))];
  const supabase = (await createSupabaseServerClient())!;
  const { data: option, error } = await supabase.from("product_options").insert({ product_id: parsed.product_id, name: parsed.name, required: parsed.required }).select("id").single();
  if (error) throw new Error(error.message);
  const { error: valuesError } = await supabase.from("product_option_values").insert(values.map((value, index) => ({ option_id: option.id, value, sort_order: index })));
  if (valuesError) throw new Error(valuesError.message);
  invalidateProductCatalog();
  revalidatePath(`/admin/produtos/${parsed.product_id}`);
}

export async function addProductVariant(formData: FormData) {
  await requireAdmin("products.manage");
  const parsed = z.object({ product_id: z.string().min(1), sku: z.string().trim().min(3), price: z.union([z.literal(""), z.coerce.number().min(0)]), stock: z.coerce.number().int().min(0), image_url: z.string().optional(), active: z.boolean() }).parse({ ...Object.fromEntries(formData.entries()), active: formData.has("active") });
  const supabase = (await createSupabaseServerClient())!;
  const { data: variant, error } = await supabase.from("product_variants").insert({ product_id: parsed.product_id, sku: parsed.sku, price: parsed.price === "" ? null : parsed.price, stock: parsed.stock, image_url: parsed.image_url || null, active: parsed.active }).select("id").single();
  if (error) throw new Error(error.message);
  const valueIds = formData.getAll("option_value_ids").map(String).filter(Boolean);
  if (valueIds.length) {
    const { error: relationError } = await supabase.from("variant_option_values").insert(valueIds.map((option_value_id) => ({ variant_id: variant.id, option_value_id })));
    if (relationError) throw new Error(relationError.message);
  }
  invalidateProductCatalog();
  revalidatePath(`/admin/produtos/${parsed.product_id}`);
}

export async function deleteProductVariant(formData: FormData) {
  await requireAdmin("products.manage");
  const parsed = z.object({ product_id: z.string().min(1), variant_id: z.string().min(1) }).parse(Object.fromEntries(formData.entries()));
  const { error } = await (await createSupabaseServerClient())!.from("product_variants").delete().eq("id", parsed.variant_id).eq("product_id", parsed.product_id);
  if (error) throw new Error(error.message);
  invalidateProductCatalog();
  revalidatePath(`/admin/produtos/${parsed.product_id}`);
}
