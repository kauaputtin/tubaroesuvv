import { AlertTriangle, ArrowDown, ArrowUp, Box } from "lucide-react";
import { InlineStockInput } from "@/components/inline-stock-input";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function InventoryPage() {
  const admin = await requireAdmin("products.view");
  const canManageInventory = admin.permissions.includes("inventory.manage");
  const supabase = (await createSupabaseServerClient())!;
  const [{ data: products }, { data: movements }] = await Promise.all([
    supabase.from("products").select("id,name,sku,stock,reserved_stock,minimum_stock").order("stock"),
    supabase.from("inventory_movements").select("id,type,quantity,balance_after,reason,created_at,products(name)").order("created_at", { ascending: false }).limit(25),
  ]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-7">
        <p className="text-sm text-slate-500">Clique no estoque físico para editar. O valor é salvo automaticamente ao sair do campo.</p>
        <h1 className="font-display mt-1 text-3xl font-black uppercase text-[#001b3b]">Estoque</h1>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_390px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-[0.65rem] uppercase tracking-wider text-slate-400">
                <tr><th className="px-5 py-3">Produto</th><th className="px-5 py-3">Estoque físico</th><th className="px-5 py-3">Reservado</th><th className="px-5 py-3">Disponível</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products?.map((product) => {
                  const available = product.stock - product.reserved_stock;
                  const low = available <= product.minimum_stock;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4"><strong className="block text-slate-800">{product.name}</strong><span className="font-mono text-xs text-slate-400">{product.sku}</span></td>
                      <td className="px-5 py-4"><InlineStockInput key={`${product.id}:${product.stock}:${product.reserved_stock}`} productId={product.id} initialStock={product.stock} reservedStock={product.reserved_stock} disabled={!canManageInventory} /></td>
                      <td className="px-5 py-4 font-bold text-sky-600">{product.reserved_stock}</td>
                      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 font-black ${low ? "text-amber-600" : "text-slate-800"}`}>{low && <AlertTriangle size={14} />}{available}</span></td>
                    </tr>
                  );
                })}
                {!products?.length && <tr><td colSpan={4} className="px-6 py-14 text-center text-slate-400">Nenhum produto cadastrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5"><h2 className="flex items-center gap-2 font-bold"><Box size={18} className="text-sky-500" />Movimentações recentes</h2></div>
          <div className="divide-y divide-slate-100">
            {movements?.map((movement) => {
              const product = movement.products as unknown as { name: string } | null;
              const incoming = movement.quantity > 0;
              return (
                <div key={movement.id} className="flex gap-3 p-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${incoming ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{incoming ? <ArrowUp size={16} /> : <ArrowDown size={16} />}</span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800">{product?.name ?? "Produto removido"}</strong><span className="block text-xs text-slate-500">{movement.reason}</span><span className="text-[0.65rem] text-slate-400">{formatDate(movement.created_at)}</span></span>
                  <strong className={incoming ? "text-emerald-600" : "text-amber-600"}>{incoming ? "+" : ""}{movement.quantity}</strong>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
