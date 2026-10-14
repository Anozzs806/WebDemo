import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Banner, BannerInput, Product, PromoTexts } from "@/lib/types";
import { errMsg } from "@/lib/format";
import ConfirmDialog from "@/components/ConfirmDialog";
import HeroSlide from "@/components/HeroSlide";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MAX_ACTIVE = 6;
const MAX_PROMO = 8;
const LIMITS = { title: 40, highlight: 40, subtitle: 160, label: 30 } as const;

function productIssue(b: Banner, byId: Map<string, Product>): string | null {
  const p = byId.get(b.product_id);
  if (!p) return "Produk sudah dihapus — banner disembunyikan";
  if (!p.available) return "Produk tidak tersedia — banner disembunyikan";
  return null;
}

/* ---------------- Banner form + live preview ---------------- */
function BannerForm({
  banner,
  products,
  defaultActive,
  onClose,
}: {
  banner: Banner | null;
  products: Product[];
  defaultActive: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState<BannerInput>(() =>
    banner
      ? { product_id: banner.product_id, title: banner.title, highlight: banner.highlight, subtitle: banner.subtitle, label: banner.label, active: banner.active }
      : { product_id: products[0]?.id ?? "", title: "", highlight: "", subtitle: "", label: "", active: defaultActive },
  );
  const set = <K extends keyof BannerInput>(k: K, v: BannerInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const product = products.find((p) => p.id === f.product_id);

  const save = useMutation({
    mutationFn: (body: BannerInput) => (banner ? apiPut<Banner>(`/banners/${banner.id}`, body) : apiPost<Banner>("/banners", body)),
    onSuccess: () => {
      toast.success(banner ? "Banner diperbarui" : "Banner ditambahkan");
      qc.invalidateQueries({ queryKey: ["banners"] });
      onClose();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.product_id) return toast.error("Pilih produk unggulan");
    if (!f.title.trim()) return toast.error("Judul besar wajib diisi");
    save.mutate({ ...f, title: f.title.trim(), highlight: f.highlight.trim(), subtitle: f.subtitle.trim(), label: f.label.trim() });
  };

  const text = (k: keyof typeof LIMITS, label: string, placeholder: string, multiline = false) => (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <Label htmlFor={`b-${k}`}>{label}</Label>
        <span className="text-xs text-muted-foreground">{f[k].length}/{LIMITS[k]}</span>
      </div>
      {multiline ? (
        <Textarea id={`b-${k}`} rows={2} value={f[k]} maxLength={LIMITS[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} data-testid={`banner-form-${k}-input`} />
      ) : (
        <Input id={`b-${k}`} value={f[k]} maxLength={LIMITS[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} data-testid={`banner-form-${k}-input`} />
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Produk Unggulan</Label>
          <Select value={f.product_id} onValueChange={(v: string) => set("product_id", v)}>
            <SelectTrigger className="w-full" data-testid="banner-form-product-select">
              <SelectValue>{(v) => products.find((p) => p.id === v)?.name ?? "Pilih produk"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id} data-testid={`banner-form-product-option-${p.id}`}>
                  {p.name}
                  {!p.available && " (tidak tersedia)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Gambar, nama, dan harga banner otomatis mengikuti produk ini.</p>
        </div>
        {text("label", "Label Kecil", "Contoh: Cepat, Renyah, Mantap!")}
        {text("title", "Judul Besar", "Contoh: Lapar? Pesan sekarang,")}
        {text("highlight", "Judul Sorotan (merah)", "Contoh: siap dalam kilat.")}
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
          <Checkbox checked={f.active} onCheckedChange={(v) => set("active", !!v)} data-testid="banner-form-active-checkbox" />
          Aktif (tampil di halaman utama)
        </label>
        <div className="sm:col-span-2">{text("subtitle", "Sub-judul / Deskripsi", "Deskripsi singkat promo", true)}</div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Pratinjau Langsung</p>
        <div className="pointer-events-none relative overflow-hidden rounded-2xl border bg-brand-yellow" data-testid="banner-form-preview">
          <div className="ks-dots absolute inset-0 opacity-60" />
          <div className="relative" style={{ zoom: 0.55 }}>
            <HeroSlide content={f} product={product} testid="banner-preview-slide" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <button type="button" onClick={onClose} className="rounded-full border-2 px-5 py-2.5 font-bold" data-testid="banner-form-cancel-btn">
          Batal
        </button>
        <button type="submit" disabled={save.isPending} className="rounded-full bg-brand-red px-6 py-2.5 font-bold text-white hover:bg-brand-red-dark disabled:opacity-60" data-testid="banner-form-save-btn">
          {save.isPending ? "Menyimpan..." : "Simpan Banner"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Running promo text editor ---------------- */
function PromoEditor({ initial }: { initial: string[] }) {
  const qc = useQueryClient();
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: (body: PromoTexts) => apiPut<PromoTexts>("/promo-texts", body),
    onSuccess: () => {
      toast.success("Teks promo disimpan");
      qc.invalidateQueries({ queryKey: ["promo-texts"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const move = (i: number, d: number) =>
    setItems((prev) => {
      const next = [...prev];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  const add = () => {
    if (!draft.trim() || items.length >= MAX_PROMO) return;
    setItems((p) => [...p, draft.trim()]);
    setDraft("");
  };

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm" data-testid="promo-texts-editor">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl font-black">Teks Promo Berjalan</h3>
          <p className="text-sm text-muted-foreground">Pita hitam di atas banner. Maksimal {MAX_PROMO} kalimat, 60 karakter per kalimat.</p>
        </div>
        <button
          type="button"
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate({ items: items.map((t) => t.trim()).filter(Boolean) })}
          className="flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          data-testid="promo-texts-save-btn"
        >
          <Save className="size-4" /> Simpan Teks Promo
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl bg-brand-ink py-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">
        <div className="ks-marquee flex w-max gap-12 whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-12">
              {(items.length ? items : ["(belum ada teks promo)"]).map((t, i) => (
                <span key={i}>★ {t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((t, i) => (
          <li key={i} className="flex items-center gap-2" data-testid={`promo-text-row-${i}`}>
            <Input
              value={t}
              maxLength={60}
              onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
              className="flex-1"
              data-testid={`promo-text-input-${i}`}
            />
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-full border disabled:opacity-30" aria-label="Naik" data-testid={`promo-text-up-btn-${i}`}>
              <ArrowUp className="size-4" />
            </button>
            <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-full border disabled:opacity-30" aria-label="Turun" data-testid={`promo-text-down-btn-${i}`}>
              <ArrowDown className="size-4" />
            </button>
            <button type="button" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Hapus" data-testid={`promo-text-delete-btn-${i}`}>
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input
          value={draft}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={items.length >= MAX_PROMO ? `Maksimal ${MAX_PROMO} kalimat` : "Tulis kalimat promo baru..."}
          disabled={items.length >= MAX_PROMO}
          data-testid="promo-text-new-input"
        />
        <button type="button" onClick={add} disabled={!draft.trim() || items.length >= MAX_PROMO} className="flex items-center gap-1 rounded-full border-2 px-4 text-sm font-bold disabled:opacity-40" data-testid="promo-text-add-btn">
          <Plus className="size-4" /> Tambah
        </button>
      </div>
    </section>
  );
}

/* ---------------- Panel ---------------- */
export default function BannersPanel() {
  const qc = useQueryClient();
  const banners = useQuery({ queryKey: ["banners", "all"], queryFn: () => apiGet<Banner[]>("/banners?all=true") });
  const prods = useQuery({ queryKey: ["products", "all"], queryFn: () => apiGet<Product[]>("/products?all=true") });
  const promo = useQuery({ queryKey: ["promo-texts"], queryFn: () => apiGet<PromoTexts>("/promo-texts") });
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Banner | null>(null);

  const list = banners.isError ? [] : (banners.data ?? []);
  const products = prods.isError ? [] : (prods.data ?? []);
  const byId = new Map(products.map((p) => [p.id, p]));
  const activeCount = list.filter((b) => b.active).length;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["banners"] });
  const toggle = useMutation({
    mutationFn: (b: Banner) =>
      apiPut<Banner>(`/banners/${b.id}`, { product_id: b.product_id, title: b.title, highlight: b.highlight, subtitle: b.subtitle, label: b.label, active: !b.active }),
    onSuccess: (b) => {
      toast.success(b.active ? "Banner diaktifkan" : "Banner dinonaktifkan");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) => apiPut<Banner[]>("/banners/reorder", { ids }),
    onSuccess: invalidate,
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete(`/banners/${id}`),
    onSuccess: () => {
      toast.success("Banner dihapus");
      setToDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const move = (i: number, d: number) => {
    const ids = list.map((b) => b.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-black">Banner Halaman Utama</h2>
          <p className="text-sm text-muted-foreground">
            Banner aktif bergantian otomatis setiap 6 detik. <b data-testid="banner-active-count">{activeCount}/{MAX_ACTIVE}</b> banner aktif.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={!products.length}
          className="flex items-center gap-2 rounded-full bg-brand-red px-5 py-2.5 font-bold text-white transition-colors hover:bg-brand-red-dark disabled:opacity-60"
          data-testid="admin-add-banner-btn"
        >
          <Plus className="size-4" /> Tambah Banner
        </button>
      </div>

      <section className="rounded-3xl border bg-card p-5 shadow-sm">
        {banners.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-muted" />}
        {!banners.isLoading && list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground" data-testid="admin-banners-empty">
            Belum ada banner. Halaman utama menampilkan banner bawaan.
          </p>
        )}
        <ul className="divide-y" data-testid="admin-banner-list">
          {list.map((b, i) => {
            const p = byId.get(b.product_id);
            const issue = productIssue(b, byId);
            return (
              <li key={b.id} className={cn("flex flex-wrap items-center gap-3 py-3", !b.active && "opacity-60")} data-testid={`admin-banner-row-${b.id}`}>
                <span className="w-6 text-center font-mono text-sm font-bold text-muted-foreground">{i + 1}</span>
                {p?.image ? <img src={p.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" /> : <div className="ks-dots size-14 shrink-0 rounded-xl bg-muted" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold leading-tight" data-testid={`admin-banner-title-${b.id}`}>
                    {b.title} <span className="text-brand-red">{b.highlight}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Produk: {p?.name ?? "—"}</p>
                  {issue && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-700" data-testid={`admin-banner-warning-${b.id}`}>
                      <AlertTriangle className="size-3.5" /> {issue}
                    </p>
                  )}
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Checkbox checked={b.active} onCheckedChange={() => toggle.mutate(b)} data-testid={`admin-banner-active-toggle-${b.id}`} />
                  Aktif
                </label>
                <button type="button" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)} className="grid size-9 place-items-center rounded-full border-2 disabled:opacity-30" aria-label="Naik" data-testid={`admin-banner-up-btn-${b.id}`}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" disabled={i === list.length - 1 || reorder.isPending} onClick={() => move(i, 1)} className="grid size-9 place-items-center rounded-full border-2 disabled:opacity-30" aria-label="Turun" data-testid={`admin-banner-down-btn-${b.id}`}>
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" onClick={() => setEditing(b)} className="grid size-9 place-items-center rounded-full border-2 hover:border-brand-red/50" aria-label="Edit" data-testid={`admin-banner-edit-btn-${b.id}`}>
                  <Pencil className="size-4" />
                </button>
                <button type="button" onClick={() => setToDelete(b)} className="grid size-9 place-items-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Hapus" data-testid={`admin-banner-delete-btn-${b.id}`}>
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {promo.data && !promo.isError && <PromoEditor key={promo.data.items.join("|")} initial={promo.data.items} />}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl" data-testid="banner-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-black">{editing === "new" ? "Tambah Banner" : "Edit Banner"}</DialogTitle>
            <DialogDescription>Atur produk unggulan dan teks promo. Pratinjau di bawah menunjukkan tampilan di halaman utama.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <BannerForm
              key={editing === "new" ? "new" : editing.id}
              banner={editing === "new" ? null : editing}
              products={products}
              defaultActive={activeCount < MAX_ACTIVE}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!toDelete}
        title="Hapus banner?"
        description={`Banner "${toDelete?.title ?? ""}" akan dihapus permanen.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
