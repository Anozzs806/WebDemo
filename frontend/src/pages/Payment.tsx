import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import type { Order } from "@/lib/types";
import { DINING_LABEL, errMsg, rupiah } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import OrderItemsList from "@/components/OrderItemsList";
import { StatusBadge } from "@/components/OrderStatus";

export default function Payment() {
  const { orderNumber = "" } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => apiGet<Order>(`/orders/${encodeURIComponent(orderNumber)}`),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const order = q.isError ? undefined : q.data;

  const pay = useMutation({
    mutationFn: () => apiPost<Order>(`/orders/${encodeURIComponent(orderNumber)}/pay`),
    onSuccess: (o) => {
      qc.setQueryData(["order", orderNumber], o);
      toast.success("Pembayaran Berhasil! Pesanan diteruskan ke dapur.");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const paid = order && order.status !== "menunggu_pembayaran";

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-black tracking-tight">Pembayaran</h1>

        {q.isLoading && <div className="mt-6 h-96 animate-pulse rounded-3xl bg-muted" />}
        {q.isError && (
          <div className="mt-6 rounded-3xl border-2 border-dashed p-10 text-center" data-testid="payment-not-found">
            <p className="font-bold">Pesanan {orderNumber} tidak ditemukan atau belum dapat dimuat.</p>
            <Link to="/" className="mt-4 inline-block font-bold text-brand-red underline">Kembali ke menu</Link>
          </div>
        )}

        {order && (
          <div className="mt-6 grid gap-8 lg:grid-cols-12">
            <section className="relative overflow-hidden rounded-3xl bg-brand-red p-6 text-white shadow-xl lg:col-span-6 sm:p-8" data-testid="payment-qr-panel">
              <div className="ks-dots absolute inset-0 opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">Nomor Pesanan</p>
                  <StatusBadge status={order.status} testid="payment-status-badge" />
                </div>
                <p className="font-heading text-4xl font-black tracking-tight" data-testid="payment-order-number">{order.order_number}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-white/70">Total Pembayaran</p>
                <p className="font-mono text-3xl font-black text-brand-yellow" data-testid="payment-total">{rupiah(order.total)}</p>

                <div className="mt-6 rounded-3xl bg-white p-5 text-brand-ink">
                  {paid ? (
                    <div className="grid place-items-center gap-3 py-10 text-center" data-testid="payment-success-state">
                      <CheckCircle2 className="size-20 text-emerald-600" />
                      <p className="font-heading text-2xl font-black">Pembayaran Berhasil</p>
                      <p className="text-sm text-muted-foreground">Pesanan Anda sedang diteruskan ke dapur.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-heading font-extrabold">
                          <Zap className="size-4 fill-brand-red text-brand-red" /> KilatPay
                        </span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">QR Demo</span>
                      </div>
                      <div className="relative mx-auto mt-4 w-fit rounded-2xl border-4 border-brand-ink p-3">
                        <QRCodeSVG
                          value={`KILATSANTAP-DEMO|${order.order_number}|${order.total}|BUKAN-QRIS`}
                          size={200}
                          level="M"
                          data-testid="payment-qr-code"
                        />
                        <span className="ks-scan absolute inset-x-2 h-0.5 rounded-full bg-brand-red shadow-[0_0_12px_2px_rgb(218_41_28/0.6)]" />
                      </div>
                      <p className="mt-3 text-center text-xs text-muted-foreground">Pindai QR untuk simulasi saja</p>
                    </>
                  )}
                </div>

                {!paid ? (
                  <button
                    type="button"
                    onClick={() => pay.mutate()}
                    disabled={pay.isPending}
                    data-testid="simulate-payment-success-btn"
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-yellow py-4 font-bold text-brand-ink shadow-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  >
                    <Zap className="size-5 fill-brand-ink" />
                    {pay.isPending ? "Memproses..." : "Simulasikan Pembayaran Berhasil"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/lacak/${order.order_number}`)}
                    data-testid="payment-go-tracking-btn"
                    className="mt-6 w-full rounded-full bg-brand-yellow py-4 font-bold text-brand-ink transition-transform duration-200 hover:scale-[1.02]"
                  >
                    Lacak Status Pesanan
                  </button>
                )}
              </div>
            </section>

            <section className="space-y-5 lg:col-span-6">
              <div className="flex gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" data-testid="payment-demo-disclaimer">
                <AlertTriangle className="size-5 shrink-0" />
                <p>
                  <b>Mode Demo.</b> QR ini hanya untuk simulasi dan <b>bukan QRIS asli</b>. Tidak ada saldo atau uang sungguhan yang ditarik.
                </p>
              </div>
              <div className="rounded-3xl border bg-card p-6 shadow-sm" data-testid="payment-order-summary">
                <h2 className="font-heading text-xl font-bold">Ringkasan Pesanan</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <Info label="Nama" value={order.customer_name} testid="payment-customer-name" />
                  <Info label={order.dining_mode === "dine_in" ? "Nomor Meja" : "Nomor Antrean"} value={order.table_number} testid="payment-table-number" />
                  <Info label="Tipe Pesanan" value={DINING_LABEL[order.dining_mode]} testid="payment-dining-mode" />
                </div>
                <div className="mt-4">
                  <OrderItemsList items={order.items} />
                </div>
                <div className="mt-2 space-y-1 border-t pt-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{rupiah(order.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Biaya Layanan</span><span className="font-mono">{rupiah(order.service_fee)}</span></div>
                  <div className="flex justify-between text-base font-bold"><span>Total</span><span className="font-mono text-brand-red">{rupiah(order.total)}</span></div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-semibold" data-testid={testid}>{value}</p>
    </div>
  );
}
