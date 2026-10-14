import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Product, SelectedOption } from "@/lib/types";
import { rupiah } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

function initialSelections(p: Product): Record<string, string[]> {
  const sel: Record<string, string[]> = {};
  for (const g of p.option_groups) {
    sel[g.id] = g.type === "single" && g.required && g.choices[0] ? [g.choices[0].id] : [];
  }
  return sel;
}

function OptionForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const cart = useCart();
  const [sel, setSel] = useState<Record<string, string[]>>(() => initialSelections(product));
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  const labels: SelectedOption[] = useMemo(
    () =>
      product.option_groups.flatMap((g) =>
        g.choices.filter((c) => (sel[g.id] ?? []).includes(c.id)).map((c) => ({ group: g.name, choice: c.name, price: c.price })),
      ),
    [product, sel],
  );
  const unit = product.price + labels.reduce((s, l) => s + l.price, 0);

  const toggle = (groupId: string, choiceId: string, single: boolean, required: boolean) =>
    setSel((prev) => {
      const cur = prev[groupId] ?? [];
      if (single) return { ...prev, [groupId]: cur.includes(choiceId) && !required ? [] : [choiceId] };
      return { ...prev, [groupId]: cur.includes(choiceId) ? cur.filter((c) => c !== choiceId) : [...cur, choiceId] };
    });

  const submit = () => {
    const missing = product.option_groups.find((g) => g.required && g.choices.length > 0 && !(sel[g.id] ?? []).length);
    if (missing) {
      toast.error(`Silakan pilih ${missing.name}`);
      return;
    }
    cart.add({
      product_id: product.id,
      name: product.name,
      image: product.image,
      quantity: qty,
      selections: sel,
      labels,
      note: note.trim(),
      unit_price: unit,
    });
    toast.success(`${qty}x ${product.name} ditambahkan ke keranjang`);
    onDone();
  };

  return (
    <>
      <div className="relative -mx-4 -mt-4 h-44 overflow-hidden sm:h-52">
        {product.image && <img src={product.image} alt={product.name} className="size-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-4 right-12 text-white">
          <DialogTitle className="font-heading text-2xl font-extrabold leading-tight text-white" data-testid="option-modal-title">
            {product.name}
          </DialogTitle>
          <p className="font-mono text-sm font-bold text-brand-yellow">{rupiah(product.price)}</p>
        </div>
      </div>
      <DialogDescription className="text-sm">{product.description}</DialogDescription>

      <div className="-mx-4 max-h-[42vh] space-y-5 overflow-y-auto px-4">
        {product.option_groups.map((g) => {
          const single = g.type === "single";
          return (
            <section key={g.id} data-testid={`option-group-${g.id}`}>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-heading text-base font-bold">{g.name}</h4>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    g.required ? "bg-brand-red/10 text-brand-red" : "bg-muted text-muted-foreground",
                  )}
                >
                  {single ? (g.required ? "Wajib, pilih 1" : "Opsional, pilih 1") : "Opsional, boleh lebih dari 1"}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {g.choices.map((c) => {
                  const active = (sel[g.id] ?? []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(g.id, c.id, single, g.required)}
                      data-testid={`option-choice-${c.id}`}
                      data-active={active}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-[border-color,background-color] duration-200",
                        active ? "border-brand-red bg-brand-red/5" : "border-border hover:border-brand-red/40",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center border-2 transition-colors",
                          single ? "rounded-full" : "rounded-md",
                          active ? "border-brand-red bg-brand-red text-white" : "border-input",
                        )}
                      >
                        {active && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 font-medium">{c.name}</span>
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {c.price > 0 ? `+${rupiah(c.price)}` : "Gratis"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        <section>
          <h4 className="mb-2 font-heading text-base font-bold">Catatan Tambahan</h4>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: sambal dipisah, tanpa acar..."
            maxLength={200}
            data-testid="option-note-input"
          />
        </section>
      </div>

      <div className="flex items-center gap-3 border-t pt-4">
        <div className="flex items-center rounded-full border-2 border-border">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-9 place-items-center rounded-full hover:bg-muted" data-testid="option-qty-decrease-btn" aria-label="Kurangi">
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-mono font-bold" data-testid="option-qty-value">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="grid size-9 place-items-center rounded-full hover:bg-muted" data-testid="option-qty-increase-btn" aria-label="Tambah">
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          data-testid="modal-add-to-cart-submit"
          className="flex flex-1 items-center justify-between gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-bold text-white transition-[transform,background-color] duration-200 hover:bg-brand-red-dark active:scale-[0.98]"
        >
          <span>Tambah ke Keranjang</span>
          <span className="font-mono" data-testid="option-modal-total">{rupiah(unit * qty)}</span>
        </button>
      </div>
    </>
  );
}

export default function ProductOptionDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-4 overflow-hidden sm:max-w-xl" data-testid="product-option-modal">
        {product && <OptionForm key={product.id} product={product} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
