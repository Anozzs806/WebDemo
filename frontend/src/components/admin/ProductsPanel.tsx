import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { apiDelete, apiGet } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import { errMsg, rupiah } from "@/lib/format";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import { Badge } from "@/components/ui/badge";

export default function ProductsPanel() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/categories") });
  const prods = useQuery({ queryKey: ["products", "all"], queryFn: () => apiGet<Product[]>("/products?all=true") });
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const categories = cats.isError ? [] : (cats.data ?? []);
  const products = prods.isError ? [] : (prods.data ?? []);

  const del = useMutation({
    mutationFn: (id: string) => apiDelete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Produk dihapus");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-black">Produk, Varian & Topping</h2>
          <p className="text-sm text-muted-foreground">Atur harga produk, varian (pilih satu) dan topping (boleh lebih dari satu) untuk setiap produk.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={!categories.length}
          className="flex items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 font-bold text-white transition-colors hover:bg-brand-red-dark disabled:opacity-60"
          data-testid="admin-add-product-btn"
        >
          <Plus className="size-4" /> Tambah Produk
        </button>
      </div>

      {prods.isLoading && <div className="h-60 animate-pulse rounded-3xl bg-muted" />}

      {categories.map((c) => {
        const list = products.filter((p) => p.category_id === c.id);
        return (
          <section key={c.id} className="rounded-3xl border bg-card p-5 shadow-sm" data-testid={`admin-product-group-${c.id}`}>
            <h3 className="font-heading text-lg font-bold">
              {c.name} <span className="text-sm font-medium text-muted-foreground">({list.length})</span>
            </h3>
            {list.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Belum ada produk.</p>}
            <ul className="mt-3 divide-y">
              {list.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3" data-testid={`admin-product-row-${p.id}`}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="size-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="ks-dots size-14 shrink-0 rounded-xl bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight" data-testid={`admin-product-name-${p.id}`}>{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.option_groups.length} grup pilihan · {p.option_groups.reduce((s, g) => s + g.choices.length, 0)} opsi
                    </p>
                  </div>
                  {!p.available && <Badge variant="outline">Tidak tersedia</Badge>}
                  <span className="hidden font-mono font-bold text-brand-red sm:block" data-testid={`admin-product-price-${p.id}`}>{rupiah(p.price)}</span>
                  <button type="button" onClick={() => setEditing(p)} className="grid size-9 place-items-center rounded-full border-2 hover:border-brand-red/50" data-testid={`admin-edit-product-btn-${p.id}`} aria-label="Edit">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => setToDelete(p)} className="grid size-9 place-items-center rounded-full text-destructive hover:bg-destructive/10" data-testid={`admin-delete-product-btn-${p.id}`} aria-label="Hapus">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <ProductFormDialog
        product={editing === "new" ? null : editing}
        open={editing !== null}
        categories={categories}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Hapus produk?"
        description={`"${toDelete?.name ?? ""}" akan dihapus dari menu.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
