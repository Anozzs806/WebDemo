import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, Store, Utensils } from "lucide-react";
import { apiPost } from "@/lib/api";
import type { DiningMode, Order, OrderCreate } from "@/lib/types";
import { errMsg, rupiah, SERVICE_FEE } from "@/lib/format";
import { useCart } from "@/lib/cart";
import SiteHeader from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [mode, setMode] = useState<DiningMode>("dine_in");

  const create = useMutation({
    mutationFn: (body: OrderCreate) => apiPost<Order>("/orders", body),
    onSuccess: (order) => {
      cart.clear();
      toast.success(`Pesanan ${order.order_number} dibuat`);
      navigate(`/bayar/${order.order_number}`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (mode === "dine_in" && !table.trim())) {
      toast.error(mode === "dine_in" ? "Nama dan nomor meja wajib diisi" : "Nama pemesan wajib diisi");
      return;
    }
    create.mutate({
      customer_name: name.trim(),
      table_number: mode === "dine_in" ? table.trim() : "",
      dining_mode: mode,
      items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, selections: i.selections, note: i.note })),
    });
  };

  const total = cart.subtotal + SERVICE_FEE;

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand-red" data-testid="checkout-back-link">
          <ArrowLeft className="size-4" /> Kembali ke menu
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-black tracking-tight">Checkout</h1>

        {cart.items.length === 0 ? (
          <div className="mt-10 grid place-items-center gap-4 rounded-3xl border-2 border-dashed bg-card p-14 text-center" data-testid="checkout-empty-state">
            <ShoppingBag className="size-14 text-brand-red/40" />
            <p className="text-lg font-bold">Keranjang Anda masih kosong</p>
            <Link to="/" className="rounded-full bg-brand-red px-6 py-3 font-bold text-white" data-testid="checkout-empty-back-btn">
              Lihat Menu
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-12">
            <section className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm lg:col-span-7">
              <h2 className="font-heading text-xl font-bold">Data Pemesan</h2>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { v: "dine_in", label: "Makan di Tempat", Icon: Utensils },
                    { v: "takeaway", label: "Bawa Pulang", Icon: Store },
                  ] as const
                ).map(({ v, label, Icon }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMode(v)}
                    data-testid={`checkout-mode-${v}-btn`}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 font-bold transition-colors duration-200",
                      mode === v ? "border-brand-red bg-brand-red/5 text-brand-red" : "border-border hover:border-brand-red/40",
                    )}
                  >
                    <Icon className="size-6" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Pemesan</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Budi" maxLength={60} className="h-11" data-testid="checkout-customer-name-input" />
              </div>
              {mode === "dine_in" ? (
                <div className="space-y-2">
                  <Label htmlFor="table">Nomor Meja</Label>
                  <Input id="table" value={table} onChange={(e) => setTable(e.target.value)} placeholder="Contoh: 12" maxLength={20} className="h-11" data-testid="checkout-table-number-input" />
                  <p className="text-xs text-muted-foreground">Lihat nomor yang tertera di meja Anda.</p>
                </div>
              ) : (
                <div className="flex gap-3 rounded-2xl border-2 border-dashed border-brand-red/30 bg-brand-red/5 p-4 text-sm" data-testid="checkout-takeaway-queue-info">
                  <Store className="size-5 shrink-0 text-brand-red" />
                  <p>
                    <b>Nomor antrean dibuat otomatis</b> (contoh: A-012) setelah pesanan dibuat. Sebutkan nomor antrean atau nama Anda saat mengambil pesanan di konter.
                  </p>
                </div>
              )}
              <p className="rounded-xl bg-brand-cream p-3 text-sm text-brand-ink/80">
                Nomor pesanan dibuat otomatis setelah Anda menekan tombol di bawah. Anda akan diarahkan ke halaman pembayaran QR (demo).
              </p>
            </section>

            <aside className="lg:col-span-5">
              <div className="sticky top-24 rounded-3xl border bg-card p-6 shadow-sm" data-testid="checkout-summary">
                <h2 className="font-heading text-xl font-bold">Ringkasan Pesanan</h2>
                <ul className="mt-4 divide-y">
                  {cart.items.map((it) => (
                    <li key={it.key} className="flex gap-3 py-3" data-testid="checkout-summary-item">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-yellow font-mono text-xs font-bold">{it.quantity}x</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-tight">{it.name}</p>
                        {it.labels.length > 0 && (
                          <p className="text-xs text-muted-foreground">{it.labels.map((l) => `${l.group}: ${l.choice}`).join(" · ")}</p>
                        )}
                        {it.note && <p className="text-xs italic text-muted-foreground">Catatan: {it.note}</p>}
                      </div>
                      <span className="font-mono text-sm font-bold">{rupiah(it.unit_price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 space-y-1.5 border-t pt-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono font-semibold" data-testid="checkout-subtotal">{rupiah(cart.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Biaya Layanan</span><span className="font-mono font-semibold">{rupiah(SERVICE_FEE)}</span></div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-heading text-lg font-bold">Total Bayar</span>
                    <span className="font-mono text-2xl font-black text-brand-red" data-testid="checkout-total">{rupiah(total)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={create.isPending}
                  data-testid="checkout-submit-order-btn"
                  className="mt-5 w-full rounded-full bg-brand-red py-4 font-bold text-white transition-[transform,background-color] duration-200 hover:bg-brand-red-dark active:scale-[0.98] disabled:opacity-60"
                >
                  {create.isPending ? "Membuat pesanan..." : "Buat Pesanan & Bayar"}
                </button>
              </div>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
