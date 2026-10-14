import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Printer, Search } from "lucide-react";
import { ApiError, apiGet } from "@/lib/api";
import type { Order } from "@/lib/types";
import { DINING_LABEL, formatDateTime, rupiah } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import OrderItemsList from "@/components/OrderItemsList";
import { StatusBadge, StatusStepper } from "@/components/OrderStatus";
import { ReceiptDialog } from "@/components/ThermalReceipt";
import { Input } from "@/components/ui/input";

const MESSAGES: Record<Order["status"], string> = {
  menunggu_pembayaran: "Silakan selesaikan pembayaran agar pesanan dapat diproses.",
  pembayaran_berhasil: "Pembayaran diterima. Pesanan Anda akan segera disiapkan.",
  sedang_disiapkan: "Dapur sedang menyiapkan pesanan Anda. Mohon ditunggu!",
  siap_diambil: "Pesanan Anda siap! Silakan ambil di konter.",
  selesai: "Pesanan selesai. Terima kasih & selamat menikmati!",
};

export default function Tracking() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(orderNumber ?? "");
  const [receipt, setReceipt] = useState<Order | null>(null);

  const q = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => apiGet<Order>(`/orders/${encodeURIComponent(orderNumber ?? "")}`),
    enabled: !!orderNumber,
    refetchInterval: 5000,
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const order = q.isError ? undefined : q.data;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim().toUpperCase();
    if (v) navigate(`/lacak/${v}`);
  };

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-black tracking-tight">Lacak Pesanan</h1>
        <p className="mt-1 text-muted-foreground">Masukkan nomor pesanan Anda, contoh: KS-0001</p>
        <form onSubmit={submit} className="mt-5 flex max-w-lg gap-2" data-testid="tracking-search-form">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="KS-0001"
            className="h-12 rounded-full px-5 font-mono uppercase"
            data-testid="tracking-order-number-input"
          />
          <button type="submit" className="flex items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white transition-colors hover:bg-brand-red-dark" data-testid="tracking-search-btn">
            <Search className="size-4" /> Cari
          </button>
        </form>

        {orderNumber && q.isLoading && <div className="mt-8 h-72 animate-pulse rounded-3xl bg-muted" />}
        {orderNumber && q.isError && (
          <div className="mt-8 rounded-3xl border-2 border-dashed p-10 text-center" data-testid="tracking-not-found">
            <p className="text-lg font-bold">Pesanan "{orderNumber}" tidak ditemukan.</p>
            <p className="text-sm text-muted-foreground">Periksa kembali nomor pesanan Anda.</p>
          </div>
        )}

        {order && (
          <div className="mt-8 space-y-6" data-testid="tracking-result">
            <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">Nomor Pesanan</p>
                  <p className="font-heading text-4xl font-black" data-testid="tracking-order-number">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name} · {DINING_LABEL[order.dining_mode]} · {order.dining_mode === "dine_in" ? "Meja" : "Antrean"} {order.table_number}
                  </p>
                </div>
                <StatusBadge status={order.status} testid="tracking-status-badge" />
              </div>
              <div className="mt-6 rounded-2xl bg-brand-cream p-4 font-semibold text-brand-ink" data-testid="tracking-status-message">
                {MESSAGES[order.status]}
              </div>
              <div className="mt-8">
                <StatusStepper status={order.status} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {order.status === "menunggu_pembayaran" && (
                  <Link to={`/bayar/${order.order_number}`} className="rounded-full bg-brand-red px-5 py-2.5 text-sm font-bold text-white" data-testid="tracking-pay-now-link">
                    Bayar Sekarang
                  </Link>
                )}
                <button type="button" onClick={() => setReceipt(order)} className="flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold hover:border-brand-red/50" data-testid="tracking-print-receipt-btn">
                  <Printer className="size-4" /> Cetak Struk
                </button>
                <Link to="/" className="rounded-full border-2 px-5 py-2.5 text-sm font-bold hover:border-brand-red/50" data-testid="tracking-order-again-link">
                  Pesan Lagi
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Status diperbarui otomatis setiap 5 detik · Dibuat {formatDateTime(order.created_at)}</p>
            </section>
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-xl font-bold">Detail Pesanan</h2>
              <OrderItemsList items={order.items} />
              <div className="flex justify-between border-t pt-3 font-bold">
                <span>Total</span>
                <span className="font-mono text-brand-red" data-testid="tracking-total">{rupiah(order.total)}</span>
              </div>
            </section>
          </div>
        )}
      </div>
      <ReceiptDialog order={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
