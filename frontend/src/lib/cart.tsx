import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { SelectedOption } from "@/lib/types";

export interface CartItem {
  key: string;
  product_id: string;
  name: string;
  image: string;
  quantity: number;
  selections: Record<string, string[]>;
  labels: SelectedOption[];
  note: string;
  unit_price: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "kilat-santap-cart";
const Ctx = createContext<CartCtx | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

const makeKey = (i: Omit<CartItem, "key">) => {
  const sel = Object.keys(i.selections)
    .sort()
    .map((g) => `${g}:${[...i.selections[g]].sort().join(",")}`)
    .join("|");
  return `${i.product_id}#${sel}#${i.note.trim()}`;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
      open,
      setOpen: (v: boolean) => {
        if (v) toast.dismiss(); // toasts sit bottom-right, exactly over the checkout CTA
        setOpen(v);
      },
      add: (item) =>
        setItems((prev) => {
          const key = makeKey(item);
          const found = prev.find((p) => p.key === key);
          if (found) return prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(99, p.quantity + item.quantity) } : p));
          return [...prev, { ...item, key }];
        }),
      setQty: (key, qty) =>
        setItems((prev) =>
          qty <= 0 ? prev.filter((p) => p.key !== key) : prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(99, qty) } : p)),
        ),
      remove: (key) => setItems((prev) => prev.filter((p) => p.key !== key)),
      clear: () => setItems([]),
    }),
    [items, open],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
