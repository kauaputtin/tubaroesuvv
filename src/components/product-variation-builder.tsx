"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

type VariationGroup = {
  id: string;
  name: string;
  values: string[];
  draft: string;
};

const MAX_GROUPS = 5;
const MAX_VALUES = 20;

export function ProductVariationBuilder() {
  const [groups, setGroups] = useState<VariationGroup[]>([]);
  const [error, setError] = useState("");

  function addGroup(suggestedName = "") {
    if (groups.length >= MAX_GROUPS) {
      setError(`Você pode criar no máximo ${MAX_GROUPS} grupos de variação.`);
      return;
    }
    setGroups((current) => [...current, { id: crypto.randomUUID(), name: suggestedName, values: [], draft: "" }]);
    setError("");
  }

  function updateGroup(id: string, patch: Partial<VariationGroup>) {
    setGroups((current) => current.map((group) => group.id === id ? { ...group, ...patch } : group));
  }

  function addValue(id: string) {
    setGroups((current) => current.map((group) => {
      if (group.id !== id) return group;
      const value = group.draft.trim().replace(/^,|,$/g, "");
      if (!value) return { ...group, draft: "" };
      if (group.values.length >= MAX_VALUES) {
        setError(`Cada grupo pode ter no máximo ${MAX_VALUES} valores.`);
        return group;
      }
      if (group.values.some((item) => item.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"))) {
        setError("Esse valor já foi adicionado.");
        return { ...group, draft: "" };
      }
      setError("");
      return { ...group, values: [...group.values, value], draft: "" };
    }));
  }

  function removeValue(groupId: string, value: string) {
    setGroups((current) => current.map((group) => group.id === groupId ? { ...group, values: group.values.filter((item) => item !== value) } : group));
  }

  const serializedGroups = groups.map(({ name, values }) => ({ name: name.trim(), values, required: true }));

  return (
    <div>
      <input type="hidden" name="product_options" value={JSON.stringify(serializedGroups)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">Variações</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Adicione grupos como tamanho, cor ou modelo e informe as opções disponíveis.</p>
        </div>
        {groups.length < MAX_GROUPS && <button type="button" onClick={() => addGroup()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white"><Plus size={15} />Adicionar variação</button>}
      </div>

      {!groups.length && (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-600">Este produto ainda não possui variações.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" onClick={() => addGroup("Tamanho")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-sky-400">+ Tamanho</button>
            <button type="button" onClick={() => addGroup("Cor")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-sky-400">+ Cor</button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {groups.map((group, groupIndex) => (
          <section key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <label className="min-w-0 flex-1">
                <span className="mb-1.5 block text-xs font-bold">Nome da variação</span>
                <input value={group.name} onChange={(event) => updateGroup(group.id, { name: event.target.value })} required placeholder="Ex.: Tamanho" maxLength={40} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500" />
              </label>
              <button type="button" onClick={() => setGroups((current) => current.filter((item) => item.id !== group.id))} className="mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-500 hover:bg-red-50" aria-label={`Excluir variação ${groupIndex + 1}`}><Trash2 size={17} /></button>
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-xs font-bold">Opções</span>
              <div className="flex gap-2">
                <input
                  value={group.draft}
                  onChange={(event) => updateGroup(group.id, { draft: event.target.value })}
                  onBlur={() => addValue(group.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addValue(group.id);
                    }
                  }}
                  placeholder={group.name.toLocaleLowerCase("pt-BR").includes("tamanho") ? "Ex.: P, M, G" : "Digite uma opção e pressione Enter"}
                  maxLength={40}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-sky-500"
                />
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => addValue(group.id)} className="h-11 rounded-xl bg-sky-500 px-4 text-xs font-black text-white">Adicionar</button>
              </div>
              <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                {group.values.map((value) => (
                  <span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-3 pr-2 text-xs font-bold text-slate-700 shadow-sm">
                    {value}
                    <button type="button" onClick={() => removeValue(group.id, value)} className="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label={`Remover ${value}`}><X size={13} /></button>
                  </span>
                ))}
                {!group.values.length && <span className="text-xs text-slate-400">Adicione ao menos uma opção.</span>}
              </div>
            </div>
          </section>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
