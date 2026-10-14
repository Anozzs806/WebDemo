import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { rupiah } from "@/lib/format";

export default function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const hasOptions = product.option_groups.length > 0;
  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <button type="button" onClick={() => onAdd(product)} className="relative aspect-[4/3] overflow-hidden bg-muted" data-testid={`product-image-btn-${product.id}`}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="ks-dots size-full" />
        )}
        {hasOptions && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-yellow px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-ink">
            Bisa Custom
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold leading-tight tracking-tight" data-testid={`product-name-${product.id}`}>{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mulai</p>
            <p className="font-mono text-lg font-extrabold text-brand-red" data-testid={`product-price-${product.id}`}>{rupiah(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => onAdd(product)}
            data-testid={`add-to-cart-btn-${product.id}`}
            className="flex items-center gap-1 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-[transform,background-color] duration-200 hover:bg-brand-red-dark active:scale-95"
          >
            <Plus className="size-4" /> Tambah
          </button>
        </div>
      </div>
    </article>
  );
}
