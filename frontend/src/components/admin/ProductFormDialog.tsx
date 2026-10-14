import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { apiPost, apiPut } from "@/lib/api";
import type { Category, OptionGroup, Product, ProductInput } from "@/lib/types";
import { errMsg, newId } from "@/lib/format";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const blank = (categoryId: string): ProductInput => ({
  category_id: categoryId,
  name: "",
  description: "",
  price: 0,
  image: "",
  available: true,
  option_groups: [],
});

function Form({ product, categories, onClose }: { product: Product | null; categories: Category[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<ProductInput>(() => {
    if (!product) return blank(categories[0]?.id ?? "");
    const { id: _id, ...rest } = product;
    return structuredClone(rest);
  });
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const setGroup = (gi: number, patch: Partial<OptionGroup>) =>
    set("option_groups", f.option_groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const save = useMutation({
    mutationFn: (body: ProductInput) => (product ? apiPut<Product>(`/products/${product.id}`, body) : apiPost<Product>("/products", body)),
    onSuccess: () => {
      toast.success(product ? "Produk diperbarui" : "Produk ditambahkan");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Nama produk wajib diisi");
    const badGroup = f.option_groups.find((g) => !g.name.trim() || g.choices.length === 0 || g.choices.some((c) => !c.name.trim()));
    if (badGroup) return toast.error("Setiap grup pilihan harus punya nama dan minimal 1 opsi bernama");
    save.mutate({ ...f, name: f.name.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-name">Nama Produk</Label>
          <Input id="p-name" value={f.name} onChange={(e) => set("name", e.target.value)} data-testid="product-form-name-input" />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select value={f.category_id} onValueChange={(v: string) => set("category_id", v)}>
            <SelectTrigger className="w-full" data-testid="product-form-category-select">
              <SelectValue>{(v) => categories.find((c) => c.id === v)?.name ?? "Pilih kategori"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} data-testid={`product-form-category-option-${c.id}`}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-price">Harga Dasar (Rp)</Label>
          <Input id="p-price" type="number" min={0} step={500} value={f.price} onChange={(e) => set("price", Math.max(0, Number(e.target.value) || 0))} data-testid="product-form-price-input" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-img">URL Gambar</Label>
          <div className="flex gap-3">
            <Input id="p-img" value={f.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." data-testid="product-form-image-input" />
            {f.image && <img src={f.image} alt="" className="size-10 shrink-0 rounded-lg object-cover" />}
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-desc">Deskripsi</Label>
          <Textarea id="p-desc" value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} data-testid="product-form-description-input" />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <Checkbox checked={f.available} onCheckedChange={(v) => set("available", !!v)} data-testid="product-form-available-checkbox" />
          Tersedia untuk dipesan
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-heading text-lg font-bold">Varian & Topping</h4>
          <button
            type="button"
            onClick={() =>
              set("option_groups", [
                ...f.option_groups,
                { id: newId(), name: "", type: "single", required: true, choices: [{ id: newId(), name: "", price: 0 }] },
              ])
            }
            className="flex items-center gap-1 rounded-full border-2 px-3 py-1 text-sm font-bold hover:border-brand-red/50"
            data-testid="product-form-add-group-btn"
          >
            <Plus className="size-4" /> Grup Pilihan
          </button>
        </div>
        {f.option_groups.length === 0 && <p className="text-sm text-muted-foreground">Produk ini belum punya varian/topping.</p>}
        {f.option_groups.map((g, gi) => (
          <div key={g.id} className="space-y-3 rounded-2xl border-2 bg-muted/40 p-4" data-testid={`product-form-group-${gi}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={g.name}
                onChange={(e) => setGroup(gi, { name: e.target.value })}
                placeholder="Nama grup, mis. Sambal / Topping"
                className="min-w-40 flex-1 bg-card"
                data-testid={`product-form-group-name-input-${gi}`}
              />
              <div className="flex rounded-full border-2 bg-card p-0.5 text-xs font-bold">
                {(["single", "multiple"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGroup(gi, { type: t, required: t === "single" ? g.required : false })}
                    className={cn("rounded-full px-3 py-1 transition-colors", g.type === t ? "bg-brand-red text-white" : "")}
                    data-testid={`product-form-group-type-${t}-${gi}`}
                  >
                    {t === "single" ? "Varian (pilih 1)" : "Topping (multi)"}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-xs font-semibold">
                <Checkbox checked={g.required} onCheckedChange={(v) => setGroup(gi, { required: !!v })} data-testid={`product-form-group-required-${gi}`} />
                Wajib
              </label>
              <button
                type="button"
                onClick={() => set("option_groups", f.option_groups.filter((_, i) => i !== gi))}
                className="grid size-8 place-items-center rounded-full text-destructive hover:bg-destructive/10"
                data-testid={`product-form-group-delete-btn-${gi}`}
                aria-label="Hapus grup"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {g.choices.map((c, ci) => (
              <div key={c.id} className="flex items-center gap-2">
                <Input
                  value={c.name}
                  onChange={(e) => setGroup(gi, { choices: g.choices.map((x, i) => (i === ci ? { ...x, name: e.target.value } : x)) })}
                  placeholder="Nama opsi"
                  className="flex-1 bg-card"
                  data-testid={`product-form-choice-name-input-${gi}-${ci}`}
                />
                <span className="text-xs font-semibold text-muted-foreground">+Rp</span>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={c.price}
                  onChange={(e) =>
                    setGroup(gi, { choices: g.choices.map((x, i) => (i === ci ? { ...x, price: Math.max(0, Number(e.target.value) || 0) } : x)) })
                  }
                  className="w-28 bg-card"
                  data-testid={`product-form-choice-price-input-${gi}-${ci}`}
                />
                <button
                  type="button"
                  onClick={() => setGroup(gi, { choices: g.choices.filter((_, i) => i !== ci) })}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  data-testid={`product-form-choice-delete-btn-${gi}-${ci}`}
                  aria-label="Hapus opsi"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setGroup(gi, { choices: [...g.choices, { id: newId(), name: "", price: 0 }] })}
              className="text-sm font-bold text-brand-red hover:underline"
              data-testid={`product-form-add-choice-btn-${gi}`}
            >
              + Tambah opsi
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <button type="button" onClick={onClose} className="rounded-full border-2 px-5 py-2.5 font-bold" data-testid="product-form-cancel-btn">
          Batal
        </button>
        <button type="submit" disabled={save.isPending} className="rounded-full bg-brand-red px-6 py-2.5 font-bold text-white hover:bg-brand-red-dark disabled:opacity-60" data-testid="product-form-save-btn">
          {save.isPending ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </div>
    </form>
  );
}

export default function ProductFormDialog({
  product,
  open,
  categories,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  categories: Category[];
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" data-testid="product-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-black">{product ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          <DialogDescription>Harga akhir = harga dasar + harga tambahan dari varian/topping yang dipilih.</DialogDescription>
        </DialogHeader>
        {open && <Form key={product?.id ?? "new"} product={product} categories={categories} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
