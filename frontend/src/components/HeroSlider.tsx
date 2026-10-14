import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner, Product } from "@/lib/types";
import HeroSlide, { FALLBACK_SLIDE } from "@/components/HeroSlide";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6000;

export interface Slide {
  banner: Banner;
  product: Product;
}

export default function HeroSlider({
  slides,
  onOrder,
  onFallbackOrder,
}: {
  slides: Slide[];
  onOrder: (p: Product) => void;
  onFallbackOrder: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const current = count ? slides[index % count] : undefined;

  const go = (next: number, d: number) => {
    if (!count) return;
    setDir(d);
    setIndex(((next % count) + count) % count);
  };

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = setTimeout(() => go(index + 1, 1), INTERVAL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count, paused]);

  return (
    <section
      className="relative overflow-hidden bg-brand-yellow"
      data-testid="home-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="ks-dots absolute inset-0 opacity-60" />
      <div className="relative grid min-h-[760px] items-center sm:min-h-[700px] md:min-h-[520px]">
        {current ? (
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={current.banner.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <HeroSlide
                content={current.banner}
                product={current.product}
                onOrder={() => onOrder(current.product)}
                testid={`hero-slide-${index}`}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <HeroSlide content={FALLBACK_SLIDE} onOrder={onFallbackOrder} testid="hero-slide-fallback" />
        )}
      </div>

      {count > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2" data-testid="hero-dots">
          <button
            type="button"
            onClick={() => go(index - 1, -1)}
            aria-label="Banner sebelumnya"
            data-testid="hero-prev-btn"
            className="grid size-9 place-items-center rounded-full bg-white/80 text-brand-ink shadow-lg backdrop-blur transition-[transform,background-color] duration-200 hover:scale-110 hover:bg-white"
          >
            <ChevronLeft className="size-5" />
          </button>

            {slides.map((s, i) => (
              <button
                key={s.banner.id}
                type="button"
                onClick={() => go(i, i > index ? 1 : -1)}
                aria-label={`Banner ${i + 1}`}
                data-testid={`hero-dot-${i}`}
                data-active={i === index}
                className={cn(
                  "h-2.5 rounded-full transition-[width,background-color] duration-300",
                  i === index ? "w-8 bg-brand-red" : "w-2.5 bg-brand-ink/30 hover:bg-brand-ink/50",
                )}
              />
            ))}
          <button
            type="button"
            onClick={() => go(index + 1, 1)}
            aria-label="Banner berikutnya"
            data-testid="hero-next-btn"
            className="grid size-9 place-items-center rounded-full bg-white/80 text-brand-ink shadow-lg backdrop-blur transition-[transform,background-color] duration-200 hover:scale-110 hover:bg-white"
          >
            <ChevronRight className="size-5" />
          </button>
          </div>
        </>
      )}
    </section>
  );
}
