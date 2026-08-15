"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";

export type ExistingProductImage = {
  id: string;
  url: string;
};

type GalleryItem = {
  id: string;
  kind: "existing" | "new";
  url: string;
  file?: File;
};

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function ProductImageManager({ initialImages = [] }: { initialImages?: ExistingProductImage[] }) {
  const [items, setItems] = useState<GalleryItem[]>(() => initialImages.slice(0, MAX_IMAGES).map((image) => ({ ...image, kind: "existing" })));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pickerRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    if (!uploadRef.current || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    items.filter((item) => item.kind === "new" && item.file).forEach((item) => transfer.items.add(item.file!));
    uploadRef.current.files = transfer.files;
  }, [items]);

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const selected = Array.from(fileList);
    const invalidType = selected.some((file) => !ACCEPTED_TYPES.has(file.type));
    const oversized = selected.some((file) => file.size > MAX_FILE_SIZE);
    const available = MAX_IMAGES - items.length;
    const accepted = selected.filter((file) => ACCEPTED_TYPES.has(file.type) && file.size <= MAX_FILE_SIZE).slice(0, available);

    if (invalidType) setError("Use somente imagens JPG, PNG, WebP ou AVIF.");
    else if (oversized) setError("Cada imagem deve ter no máximo 5 MB.");
    else if (selected.length > available) setError(`Você pode adicionar no máximo ${MAX_IMAGES} imagens.`);
    else setError("");

    const additions = accepted.map((file) => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { id: crypto.randomUUID(), kind: "new" as const, url, file };
    });
    setItems((current) => [...current, ...additions]);
    if (pickerRef.current) pickerRef.current.value = "";
  }

  function removeItem(id: string) {
    setItems((current) => {
      const item = current.find((candidate) => candidate.id === id);
      if (item?.kind === "new") {
        URL.revokeObjectURL(item.url);
        objectUrls.current.delete(item.url);
      }
      return current.filter((candidate) => candidate.id !== id);
    });
    setError("");
  }

  function moveItem(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setItems((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedId(null);
  }

  const order = items.map((item) => `${item.kind}:${item.id}`);
  const existingIds = items.filter((item) => item.kind === "existing").map((item) => item.id);
  const newIds = items.filter((item) => item.kind === "new").map((item) => item.id);

  return (
    <div>
      <input ref={uploadRef} name="image_files" type="file" multiple className="hidden" tabIndex={-1} />
      <input name="image_order" type="hidden" value={JSON.stringify(order)} />
      <input name="existing_image_ids" type="hidden" value={JSON.stringify(existingIds)} />
      <input name="new_image_ids" type="hidden" value={JSON.stringify(newIds)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">Imagens do produto</h2>
          <p className="mt-1 text-xs text-slate-500">A primeira imagem será a capa. Arraste os cartões para trocar a ordem.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items.length}/{MAX_IMAGES}</span>
      </div>

      {items.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, index) => (
            <article
              key={`${item.kind}:${item.id}`}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveItem(item.id)}
              className={`group relative overflow-hidden rounded-2xl border bg-white transition ${draggedId === item.id ? "scale-95 border-sky-400 opacity-60" : "border-slate-200 hover:border-sky-300"}`}
            >
              <div className="relative aspect-square bg-slate-100">
                <Image src={item.url} alt={`Imagem ${index + 1} do produto`} fill sizes="(max-width: 640px) 50vw, 180px" unoptimized={item.kind === "new"} className="object-cover" />
                {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-sky-500 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-wide text-white">Capa</span>}
                <span className="absolute right-2 top-2 flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm active:cursor-grabbing"><GripVertical size={16} /></span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5">
                <span className="truncate text-[0.65rem] font-bold text-slate-500">Imagem {index + 1}</span>
                <button type="button" onClick={() => removeItem(item.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50" aria-label={`Excluir imagem ${index + 1}`}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {items.length < MAX_IMAGES && (
        <button type="button" onClick={() => pickerRef.current?.click()} className="mt-5 flex min-h-28 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 px-5 text-sm font-bold text-sky-700 transition hover:border-sky-500 hover:bg-sky-100">
          <ImagePlus size={22} />
          {items.length ? "Adicionar mais imagens" : "Adicionar imagens"}
        </button>
      )}
      <input ref={pickerRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => addFiles(event.currentTarget.files)} className="hidden" />
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-slate-400">JPG, PNG, WebP ou AVIF, até 5 MB por imagem.</p>
    </div>
  );
}
