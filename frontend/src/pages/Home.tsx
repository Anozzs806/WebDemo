import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Banner, Category, Product, PromoTexts } from "@/lib/types";
import { rupiah } from "@/lib/format";
import { useCart } from "@/lib/cart";
import SiteHeader from "@/components/SiteHeader";
import ProductCard from "@/components/ProductCard";
import ProductOptionDialog from "@/components/ProductOptionDialog";
import HeroSlider, { type Slide } from "@/components/HeroSlider";
import { cn } from "@/lib/utils";

const DEFAULT_PROMO = ["Ayam krispi digoreng setiap pesanan", "Bayar pakai QR (demo)", "Lacak pesanan secara langsung"];

export default function Home() {
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => apiGet<Category[]>("/categories") });
  const prods = useQuery({ queryKey: ["products"], queryFn: () => apiGet<Product[]>("/products") });
  const bannersQ = useQuery({ queryKey: ["banners", "public"], queryFn: () => apiGet<Banner[]>("/banners") });
  const promoQ = useQuery({ queryKey: ["promo-texts"], queryFn: () => apiGet<PromoTexts>("/promo-texts") });
  const [selected, setSelected] = useState<Product | null>(null);
  const [activeCat, setActiveCat] = useState<string>("");
  const cart = useCart();

  const categories = cats.isError ? [] : (cats.data ?? []);
  const products = prods.isError ? [] : (prods.data ?? []);
  const loading = cats.isLoading || prods.isLoading;
  const failed = cats.isError || prods.isError;
  const promo = promoQ.isError || !promoQ.data ? DEFAULT_PROMO : promoQ.data.items;
  const slides: Slide[] = (bannersQ.isError ? [] : (bannersQ.data ?? [])).flatMap((b) => {
    const product = products.find((p) => p.id === b.product_id);
    return product ? [{ banner: b, product }] : [];
  });

  const jump = (id: string) => {
    setActiveCat(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen pb-28">
      <SiteHeader />

      {/* promo marquee */}
      {promo.length > 0 && (
        <div className="overflow-hidden bg-brand-ink py-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow" data-testid="promo-marquee">
          <div className="ks-marquee flex w-max gap-12 whitespace-nowrap">
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-12">
                {promo.map((t, i) => (
                  <span key={i}>★ {t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* hero slider */}
      <HeroSlider slides={slides} onOrder={setSelected} onFallbackOrder={() => categories[0] && jump(categories[0].id)} />

      {/* category bar */}
      <div className="sticky top-[6.25rem] z-30 border-b bg-white/90 backdrop-blur-md sm:top-16">
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8" data-testid="category-bar">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-muted" />)}
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => jump(c.id)}
              data-testid={`category-tab-${c.id}`}
              className={cn(
                "shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors duration-200",
                activeCat === c.id ? "border-brand-red bg-brand-red text-white" : "border-border bg-white hover:border-brand-red/50",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* menu */}
      <main className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 lg:px-8" data-testid="menu-section">
        {failed && (
          <div className="rounded-2xl border-2 border-dashed p-10 text-center text-muted-foreground" data-testid="menu-error-state">
            Menu belum dapat dimuat. Silakan muat ulang halaman beberapa saat lagi.
          </div>
        )}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}
        {categories.map((c) => {
          const list = products.filter((p) => p.category_id === c.id);
          if (!list.length) return null;
          return (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-40" data-testid={`category-section-${c.id}`}>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Kategori</p>
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight">{c.name}</h2>
                </div>
                <span className="text-sm text-muted-foreground">{list.length} menu</span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={setSelected} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="border-t bg-brand-ink py-8 text-center text-sm text-white/70">
        <p className="font-heading text-lg font-bold text-white">Kilat<span className="text-brand-yellow">Santap</span></p>
        <p className="mt-1">Website demo pemesanan makanan. Restoran & pembayaran bersifat fiktif.</p>
      </footer>

      {/* floating cart bar */}
      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 px-4">
          <button
            type="button"
            onClick={() => cart.setOpen(true)}
            data-testid="floating-cart-bar"
            className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-full bg-brand-ink px-5 py-3.5 text-white shadow-2xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand-yellow text-brand-ink">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-left text-sm">
              <span className="block font-bold">{cart.count} item di keranjang</span>
              <span className="text-white/70">Lihat keranjang</span>
            </span>
            <span className="ml-auto font-mono text-lg font-black text-brand-yellow">{rupiah(cart.subtotal)}</span>
          </button>
        </div>
      )}

      <ProductOptionDialog product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
