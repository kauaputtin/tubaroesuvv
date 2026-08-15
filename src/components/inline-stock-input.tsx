"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import { setStock } from "@/app/(dashboard)/admin/estoque/actions";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function InlineStockInput({ productId, initialStock, reservedStock, disabled = false }: { productId: string; initialStock: number; reservedStock: number; disabled?: boolean }) {
  const [value, setValue] = useState(String(initialStock));
  const [committedStock, setCommittedStock] = useState(initialStock);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function save() {
    if (disabled || status === "saving") return;
    const nextStock = Number(value);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setValue(String(committedStock));
      setStatus("error");
      setError("Use um número inteiro maior ou igual a zero.");
      return;
    }
    if (nextStock < reservedStock) {
      setValue(String(committedStock));
      setStatus("error");
      setError(`Mínimo permitido: ${reservedStock} unidades reservadas.`);
      return;
    }
    if (nextStock === committedStock) {
      setStatus("idle");
      setError("");
      return;
    }

    const currentRequest = ++requestId.current;
    setStatus("saving");
    setError("");
    const result = await setStock(productId, nextStock);
    if (currentRequest !== requestId.current) return;
    if (result.error || result.stock === undefined) {
      setValue(String(committedStock));
      setStatus("error");
      setError(result.error || "Não foi possível salvar.");
      return;
    }

    setCommittedStock(result.stock);
    setValue(String(result.stock));
    setStatus("saved");
    router.refresh();
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <div className="relative w-28">
      <input
        type="number"
        min={reservedStock}
        step="1"
        inputMode="numeric"
        value={value}
        disabled={disabled || status === "saving"}
        onChange={(event) => { setValue(event.target.value); setStatus("idle"); setError(""); }}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setValue(String(committedStock));
            setStatus("idle");
            setError("");
            event.currentTarget.blur();
          }
        }}
        aria-label="Estoque físico atual"
        aria-invalid={status === "error"}
        title={error || "Clique para alterar. O valor é salvo ao sair do campo."}
        className={`h-10 w-full rounded-xl border bg-white pl-3 pr-9 text-center text-sm font-black tabular-nums outline-none transition focus:ring-2 ${status === "error" ? "border-red-400 text-red-600 focus:ring-red-100" : status === "saved" ? "border-emerald-400 text-emerald-700 focus:ring-emerald-100" : "border-slate-200 text-slate-800 hover:border-slate-300 focus:border-sky-500 focus:ring-sky-100"} disabled:cursor-not-allowed disabled:bg-slate-50`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {status === "saving" && <LoaderCircle size={15} className="animate-spin text-sky-500" />}
        {status === "saved" && <Check size={15} className="text-emerald-600" />}
        {status === "error" && <AlertCircle size={15} className="text-red-500" />}
      </span>
    </div>
  );
}
