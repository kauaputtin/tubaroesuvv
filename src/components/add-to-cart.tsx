"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AddToCart({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const { addItem } = useCart();

  const missingOption = product.options.find((option) => option.required && !selectedOptions[option.name]);
  const selectedVariant = product.variants?.find((variant) => variant.active && Object.entries(variant.options).every(([key, value]) => selectedOptions[key] === value));

  function handleAdd() {
    if (missingOption) {
      setMessage(`Selecione ${missingOption.name.toLowerCase()}.`);
      return;
    }
    if (product.variants?.length && !selectedVariant) {
      setMessage("Esta combinação está indisponível.");
      return;
    }
    if (selectedVariant && selectedVariant.stock < quantity) {
      setMessage("Estoque insuficiente para esta variação.");
      return;
    }
    addItem(product, quantity, selectedOptions);
    setMessage("Adicionado ao carrinho!");
    window.setTimeout(() => setMessage(""), 2500);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={product.stock < 1}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#001b3b] px-4 text-sm font-black text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <ShoppingBag size={17} /> {product.stock > 0 ? "Adicionar" : "Esgotado"}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      {product.options.map((option) => (
        <fieldset key={option.name}>
          <legend className="mb-2 text-sm font-bold text-slate-800">
            {option.name} {option.required && <span className="text-sky-600">*</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const selected = selectedOptions[option.name] === value;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setSelectedOptions((current) => ({ ...current, [option.name]: value }))}
                  className={cn(
                    "min-w-12 rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                    selected ? "border-sky-500 bg-sky-500 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-sky-400",
                  )}
                  aria-pressed={selected}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-13 items-center justify-between rounded-xl border border-slate-200 bg-white px-2 sm:w-36">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="p-2" aria-label="Diminuir quantidade"><Minus size={17} /></button>
          <span className="font-bold tabular-nums">{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => Math.min(selectedVariant?.stock ?? product.stock, value + 1))} className="p-2" aria-label="Aumentar quantidade"><Plus size={17} /></button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={product.stock < 1}
          className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {message ? <Check size={20} /> : <ShoppingBag size={20} />}
          {message || (product.stock > 0 ? "Adicionar ao carrinho" : "Produto esgotado")}
        </button>
      </div>
      {missingOption && message && <p className="text-sm font-medium text-amber-700" role="alert">{message}</p>}
    </div>
  );
}
