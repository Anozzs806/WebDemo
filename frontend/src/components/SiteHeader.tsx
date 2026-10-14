import { Link, NavLink } from "react-router-dom";
import { Zap, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Menu", id: "menu" },
  { to: "/lacak", label: "Lacak Pesanan", id: "tracking" },
  { to: "/admin", label: "Admin", id: "admin" },
];

export default function SiteHeader() {
  const { count, setOpen } = useCart();
  return (
    <header className="sticky top-0 z-40 bg-brand-red text-white shadow-[0_4px_20px_-8px_rgb(0_0_0/0.4)]" data-testid="site-header">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" data-testid="header-logo-link">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-yellow text-brand-red shadow-inner">
            <Zap className="size-5 fill-brand-red" />
          </span>
          <span className="font-heading text-xl font-extrabold tracking-tight">
            Kilat<span className="text-brand-yellow">Santap</span>
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end
              data-testid={`nav-link-${n.id}`}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                  isActive ? "bg-white/15 text-brand-yellow" : "text-white/90 hover:bg-white/10",
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="cart-drawer-trigger-btn"
          className="relative ml-auto flex items-center gap-2 rounded-full bg-brand-yellow px-4 py-2 text-sm font-bold text-brand-ink transition-transform duration-200 hover:scale-105 active:scale-95 sm:ml-2"
        >
          <ShoppingBag className="size-4" />
          <span className="hidden sm:inline">Keranjang</span>
          <span
            key={count}
            data-testid="cart-count-badge"
            className="ks-pop grid min-w-6 place-items-center rounded-full bg-brand-ink px-1.5 text-xs text-white"
          >
            {count}
          </span>
        </button>
      </div>
      <nav className="flex border-t border-white/15 sm:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end
            data-testid={`mobile-nav-link-${n.id}`}
            className={({ isActive }) =>
              cn("flex-1 py-2 text-center text-xs font-semibold", isActive ? "bg-white/15 text-brand-yellow" : "text-white/90")
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
