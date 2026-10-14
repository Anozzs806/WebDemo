import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Category, CategoryInput, Product } from "@/lib/types";
import { errMsg } from "@/lib/format";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";

function CategoryRow({ cat, productCount }: { cat: Category; productCount: number }) {
  const qc = useQueryClient();
  const [name, setName] = useState(cat.name);
  const [order, setOrder] = useState(cat.sort_order);
  const [confirm, setConfirm] = useState(false);
  const dirty = name !== cat.name || order !== cat.sort_order;

  const save = useMutation({
    mutationFn: (body: CategoryInput) => apiPut<Category>(`/categories/${cat.id}`, body),
    onSuccess: () => {
      toast.success("Kategori disimpan");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: () => apiDelete(`/categories/${cat.id}`),
    onSuccess: () => {
      toast.success("Kategori dihapus");
      setConfirm(false);
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => {
      setConfirm(false);
      toast.error(errMsg(e));
    },
  });

  return (
    <li className="flex flex-wrap items-center gap-2 py-3" data-testid={`admin-category-row-${cat.id}`}>
      <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className="w-20" aria-label="Urutan" data-testid={`admin-category-order-input-${cat.id}`} />
      <Input value={name} onChange={(e) => setName(e.target.value)} className="min-w-40 flex-1" data-testid={`admin-category-name-input-${cat.id}`} />
      <span className="w-20 text-xs text-muted-foreground">{productCount} produk</span>
      <button
        type="button"
        disabled={!dirty || !name.trim() || save.isPending}
        onClick={() => save.mutate({ name: name.trim(), sort_order: order })}
        className="flex items-center gap-1 rounded-full bg-brand-red px-3 py-1.5 text-sm font-bold text-white disabled:opacity-40"
        data-testid={`admin-category-save-btn-${cat.id}`}
      >
        <Save className="size-4" /> Simpan
      </button>
      <button type="button" onClick={() => setConfirm(true)} className="grid size-9 place-items-center rounded-full text-destructive hover:bg-destructive/10" data-testid={`admin-category-delete-btn-${cat.id}`} aria-label="Hapus">
        <Trash2 className="size-4" />
      </button>
      <ConfirmDialog
        open={confirm}
        title="Hapus kategori?"
        description={productCount > 0 ? `Kategori "${cat.name}" masih punya ${productCount} produk. Hapus/pindahkan produknya dulu.` : `Kategori "${cat.name}" akan dihapus.`}
        pending={del.isPending}
        onConfirm={() => del.mutate()}
        onClose={() => setConfirm(false)}
      />
    </li>
  );
}

export default function CategoriesPanel() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/categories") });
  const prods = useQuery({ queryKey: ["products", "all"], queryFn: () => apiGet<Product[]>("/products?all=true") });
  const [name, setName] = useState("");
  const categories = cats.isError ? [] : (cats.data ?? []);
  const products = prods.isError ? [] : (prods.data ?? []);

  const create = useMutation({
    mutationFn: (body: CategoryInput) => apiPost<Category>("/categories", body),
    onSuccess: () => {
      toast.success("Kategori ditambahkan");
      setName("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), -1);
    create.mutate({ name: name.trim(), sort_order: maxOrder + 1 });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <form onSubmit={submit} className="h-fit rounded-3xl bg-brand-yellow p-6 shadow-sm lg:col-span-4" data-testid="admin-category-form">
        <h2 className="font-heading text-2xl font-black text-brand-ink">Kategori Baru</h2>
        <p className="text-sm text-brand-ink/70">Kategori tampil sebagai tab di halaman menu pelanggan.</p>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Snack" className="mt-4 h-11 bg-white" data-testid="admin-category-new-name-input" />
        <button type="submit" disabled={create.isPending || !name.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink py-3 font-bold text-white disabled:opacity-60" data-testid="admin-category-add-btn">
          <Plus className="size-4" /> Tambah Kategori
        </button>
      </form>
      <section className="rounded-3xl border bg-card p-6 shadow-sm lg:col-span-8">
        <h2 className="font-heading text-2xl font-black">Daftar Kategori</h2>
        <p className="text-sm text-muted-foreground">Ubah nama atau urutan (angka kecil tampil lebih dulu).</p>
        <ul className="mt-2 divide-y" data-testid="admin-category-list">
          {categories.map((c) => (
            <CategoryRow key={`${c.id}-${c.name}-${c.sort_order}`} cat={c} productCount={products.filter((p) => p.category_id === c.id).length} />
          ))}
        </ul>
      </section>
    </div>
  );
}
