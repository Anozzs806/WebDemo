import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Image, Lock, LogOut, Tags, UtensilsCrossed } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import type { AdminMe } from "@/lib/types";
import { errMsg } from "@/lib/format";
import { beginSession, endSession } from "@/lib/session";
import SiteHeader from "@/components/SiteHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import OrdersPanel from "@/components/admin/OrdersPanel";
import ProductsPanel from "@/components/admin/ProductsPanel";
import CategoriesPanel from "@/components/admin/CategoriesPanel";
import BannersPanel from "@/components/admin/BannersPanel";

function PinGate({ onLoggedIn }: { onLoggedIn: () => Promise<unknown> }) {
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await apiPost<AdminMe>("/auth/login", { pin });
      beginSession();
      await onLoggedIn();
      toast.success("Selamat datang, Admin!");
    } catch (err) {
      toast.error(errMsg(err, "PIN salah"));
      setPin("");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <form onSubmit={submit} className="rounded-3xl border bg-card p-8 text-center shadow-xl" data-testid="admin-pin-form">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-yellow">
          <Lock className="size-6 text-brand-red" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-black">Panel Admin</h1>
        <p className="text-sm text-muted-foreground">Masukkan PIN admin untuk melanjutkan (demo: 1234)</p>
        <Input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-5 h-14 text-center font-mono text-2xl tracking-[0.5em]"
          placeholder="••••"
          autoFocus
          data-testid="admin-pin-code-input"
        />
        <button
          type="submit"
          disabled={pending || !pin}
          className="mt-4 w-full rounded-full bg-brand-red py-3 font-bold text-white transition-colors hover:bg-brand-red-dark disabled:opacity-60"
          data-testid="admin-pin-submit-btn"
        >
          {pending ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}

export default function Admin() {
  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => apiGet<AdminMe>("/auth/me") });
  const isAdmin = !me.isError && me.data?.is_admin;

  return (
    <div className="min-h-screen bg-muted/50 pb-16">
      <SiteHeader />
      {me.isLoading ? (
        <div className="mx-auto mt-16 h-72 max-w-sm animate-pulse rounded-3xl bg-muted" />
      ) : !isAdmin ? (
        <PinGate onLoggedIn={() => me.refetch()} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Kilat Santap</p>
              <h1 className="font-heading text-4xl font-black tracking-tight">Dashboard Admin</h1>
            </div>
            <button
              type="button"
              onClick={() => endSession("/admin")}
              className="flex items-center gap-2 rounded-full border-2 bg-card px-4 py-2 text-sm font-bold hover:border-brand-red/50"
              data-testid="admin-logout-btn"
            >
              <LogOut className="size-4" /> Keluar
            </button>
          </div>
          <Tabs defaultValue="orders" className="mt-6">
            <TabsList className="h-auto flex-wrap gap-1 rounded-full bg-card p-1 shadow-sm">
              <TabsTrigger value="orders" className="rounded-full px-4 py-2 font-bold" data-testid="admin-tab-orders">
                <ClipboardList className="size-4" /> Pesanan
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-full px-4 py-2 font-bold" data-testid="admin-tab-products">
                <UtensilsCrossed className="size-4" /> Produk & Varian
              </TabsTrigger>
              <TabsTrigger value="categories" className="rounded-full px-4 py-2 font-bold" data-testid="admin-tab-categories">
                <Tags className="size-4" /> Kategori
              </TabsTrigger>
              <TabsTrigger value="banners" className="rounded-full px-4 py-2 font-bold" data-testid="admin-tab-banners">
                <Image className="size-4" /> Banner
              </TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-6">
              <OrdersPanel />
            </TabsContent>
            <TabsContent value="products" className="mt-6">
              <ProductsPanel />
            </TabsContent>
            <TabsContent value="categories" className="mt-6">
              <CategoriesPanel />
            </TabsContent>
            <TabsContent value="banners" className="mt-6">
              <BannersPanel />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
