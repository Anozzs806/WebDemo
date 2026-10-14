import type { OrderItem } from "@/lib/types";
import { rupiah } from "@/lib/format";

export default function OrderItemsList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y" data-testid="order-items-list">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 py-2.5" data-testid="order-item-row">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-yellow font-mono text-xs font-bold">{it.quantity}x</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{it.product_name}</p>
            {it.selections.length > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {it.selections.map((s) => `${s.group}: ${s.choice}${s.price > 0 ? ` (+${rupiah(s.price)})` : ""}`).join(" · ")}
              </p>
            )}
            {it.note && <p className="mt-0.5 text-xs italic text-muted-foreground">Catatan: {it.note}</p>}
          </div>
          <span className="font-mono text-sm font-bold">{rupiah(it.line_total)}</span>
        </li>
      ))}
    </ul>
  );
}
