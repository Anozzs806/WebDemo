import { ArrowRight, Clock, QrCode, Zap } from "lucide-react";
import type { BannerInput, Product } from "@/lib/types";
import { rupiah } from "@/lib/format";

export type SlideContent = Pick<BannerInput, "title" | "highlight" | "subtitle" | "label">;

export const FALLBACK_SLIDE: SlideContent = {
  label: "Cepat, Renyah, Mantap!",
  title: "Lapar? Pesan sekarang,",
  highlight: "siap dalam kilat.",
  subtitle: "Pilih menu favorit, atur sambal & topping sesukamu, bayar pakai QR demo, lalu pantau pesananmu sampai siap diambil.",
};

/** One hero slide. Pure presentation — used on the home page and as the admin live preview. */
export default function HeroSlide({
  content,
  product,
  onOrder,
  testid = "hero-slide",
}: {
  content: SlideContent;
  product?: Product;
  onOrder?: () => void;
  testid?: string;
}) {
  return (
    <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-12 md:py-14 lg:px-8" data-testid={testid}>
      <div className="md:col-span-7">
        {content.label && (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-yellow" data-testid="hero-label">
            <Zap className="size-3.5 fill-brand-yellow" /> {content.label}
          </span>
        )}
        <h1 className="mt-4 font-heading text-4xl font-black leading-[0.95] tracking-tight text-brand-ink sm:text-5xl lg:text-6xl" data-testid="hero-title">
          {content.title || "Judul banner"}
          {content.highlight && (
            <>
              <br />
              <span className="text-brand-red">{content.highlight}</span>
            </>
          )}
        </h1>
        {content.subtitle && <p className="mt-4 line-clamp-3 max-w-lg text-base text-brand-ink/80 sm:text-lg">{content.subtitle}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOrder}
            data-testid="hero-order-now-btn"
            className="flex items-center gap-2 rounded-full bg-brand-red px-6 py-3.5 font-bold text-white shadow-lg shadow-brand-red/30 transition-[transform,background-color] duration-200 hover:bg-brand-red-dark active:scale-95"
          >
            Pesan Sekarang <ArrowRight className="size-4" />
          </button>
          <a
            href="/lacak"
            data-testid="hero-track-order-link"
            className="rounded-full border-2 border-brand-ink px-6 py-3 font-bold text-brand-ink transition-colors duration-200 hover:bg-brand-ink hover:text-brand-yellow"
          >
            Lacak Pesanan
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-brand-ink/80">
          <span className="flex items-center gap-2"><Clock className="size-4" /> ± 10 menit disiapkan</span>
          <span className="flex items-center gap-2"><QrCode className="size-4" /> Bayar QR (demo)</span>
        </div>
      </div>
      <div className="relative md:col-span-5">
        <div className="absolute -right-10 -top-10 size-72 rounded-full bg-brand-red/90 md:size-96" />
        {product?.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="ks-float relative mx-auto aspect-square w-full max-w-sm rounded-[2.5rem] object-cover shadow-2xl ring-8 ring-white"
          />
        ) : (
          <div className="ks-float relative mx-auto grid aspect-square w-full max-w-sm place-items-center rounded-[2.5rem] bg-brand-red shadow-2xl ring-8 ring-white">
            <Zap className="size-32 fill-brand-yellow text-brand-yellow" />
          </div>
        )}
        {product && (
          <div className="absolute -bottom-3 left-2 rounded-2xl bg-white px-4 py-3 shadow-xl sm:left-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground" data-testid="hero-product-name">{product.name}</p>
            <p className="font-mono text-lg font-black text-brand-red" data-testid="hero-product-price">
              <span className="mr-1 text-xs font-bold text-muted-foreground">Mulai</span>
              {rupiah(product.price)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
