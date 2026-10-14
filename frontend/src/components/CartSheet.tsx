import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { rupiah, SERVICE_FEE } from "@/lib/format";

export default function CartSheet() {
  const { items, open, setOpen, setQty, remove, subtotal, count } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md" data-testid="cart-drawer">
        <SheetHeader className="border-b bg-brand-cream px-5 py-4">
          <SheetTitle className="font-heading text-2xl font-extrabold">Keranjang Anda</SheetTitle>
          <SheetDescription>{count} item dipilih</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {items.length === 0 && (
            <div className="grid place-items-center gap-3 py-16 text-center text-muted-foreground" data-testid="cart-empty-state">
              <ShoppingBag className="size-12 text-brand-red/40" />
              <p className="font-semibold">Keranjang masih kosong</p>
              <p className="text-sm">Yuk pilih menu favoritmu dulu!</p>
            </div>
          )}
          {items.map((it) => (
            <div key={it.key} className="flex gap-3 rounded-2xl border bg-card p-3" data-testid="cart-item">
              {it.image && <img src={it.image} alt={it.name} className="size-16 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold leading-tight" data-testid="cart-item-name">{it.name}</p>
                  <button
                    type="button"
                    onClick={() => remove(it.key)}
                    className="text-muted-foreground transition-colors hover:text-brand-red"
                    data-testid="cart-item-remove-btn"
                    aria-label="Hapus"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {it.labels.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground" data-testid="cart-item-options">
                    {it.labels.map((l, idx) => (
                      <li key={idx}>
                        {l.group}: <span className="font-medium text-foreground">{l.choice}</span>
                        {l.price > 0 && ` (+${rupiah(l.price)})`}
                      </li>
                    ))}
                  </ul>
                )}
                {it.note && <p className="mt-1 text-xs italic text-muted-foreground">Catatan: {it.note}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border">
                    <button type="button" onClick={() => setQty(it.key, it.quantity - 1)} className="grid size-7 place-items-center" data-testid="cart-item-decrease-btn" aria-label="Kurangi">
                      <Minus className="size-3" />
                    </button>
                    <span className="w-7 text-center font-mono text-sm font-bold" data-testid="cart-item-qty">{it.quantity}</span>
                    <button type="button" onClick={() => setQty(it.key, it.quantity + 1)} className="grid size-7 place-items-center" data-testid="cart-item-increase-btn" aria-label="Tambah">
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <p className="font-mono text-sm font-extrabold text-brand-red">{rupiah(it.unit_price * it.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="space-y-2 border-t bg-card px-5 py-4">
            <Row label="Subtotal" value={rupiah(subtotal)} testid="cart-subtotal" />
            <Row label="Biaya Layanan" value={rupiah(SERVICE_FEE)} testid="cart-service-fee" />
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-heading text-lg font-bold">Total</span>
              <span className="font-mono text-xl font-black text-brand-red" data-testid="cart-total">{rupiah(subtotal + SERVICE_FEE)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/checkout");
              }}
              data-testid="proceed-to-checkout-btn"
              className="mt-2 w-full rounded-full bg-brand-red py-3.5 font-bold text-white transition-[transform,background-color] duration-200 hover:bg-brand-red-dark active:scale-[0.98]"
            >
              Lanjut ke Checkout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold" data-testid={testid}>{value}</span>
    </div>
  );
}
