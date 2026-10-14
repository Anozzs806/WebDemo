import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck, ChefHat, Clock, Flame, PackageCheck, Printer, Trash2, Wallet } from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import type { Order, OrderStats, OrderStatus } from "@/lib/types";
import { DINING_LABEL, errMsg, formatDateTime, rupiah, STATUS_FLOW, STATUS_LABEL } from "@/lib/format";
import { StatusBadge } from "@/components/OrderStatus";
import OrderItemsList from "@/components/OrderItemsList";
import { ReceiptDialog } from "@/components/ThermalReceipt";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | OrderStatus;
const FILTERS: { v: Filter; label: string }[] = [
  { v: "all", label: "Semua" },
  { v: "active", label: "Aktif" },
  ...STATUS_FLOW.map((s) => ({ v: s as Filter, label: STATUS_LABEL[s] })),
];
const ACTIVE: OrderStatus[] = ["pembayaran_berhasil", "sedang_disiapkan", "siap_diambil"];

const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string; Icon: typeof ChefHat }>> = {
  pembayaran_berhasil: { to: "sedang_disiapkan", label: "Mulai Siapkan", Icon: ChefHat },
  sedang_disiapkan: { to: "siap_diambil", label: "Siap Diambil", Icon: PackageCheck },
  siap_diambil: { to: "selesai", label: "Selesaikan Pesanan", Icon: CheckCheck },
};

export default function OrdersPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [toDelete, setToDelete] = useState<Order | null>(null);

  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => apiGet<Order[]>("/admin/orders"), refetchInterval: 5000 });
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => apiGet<OrderStats>("/admin/stats"), refetchInterval: 5000 });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => apiPatch<Order>(`/admin/orders/${id}/status`, { status }),
    onSuccess: (o) => {
      toast.success(`${o.order_number}: ${STATUS_LABEL[o.status]}`);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/orders/${id}`),
    onSuccess: () => {
      toast.success("Pesanan dihapus");
      setToDelete(null);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const list = (orders.isError ? [] : (orders.data ?? [])).filter((o) =>
    filter === "all" ? true : filter === "active" ? ACTIVE.includes(o.status) : o.status === filter,
  );
  const s = stats.isError ? undefined : stats.data;

  const cards = [
    { label: "Pesanan Aktif", value: s?.active ?? 0, Icon: Flame, cls: "bg-brand-red text-white", id: "active" },
    { label: "Menunggu Pembayaran", value: s?.waiting_payment ?? 0, Icon: Clock, cls: "bg-brand-yellow text-brand-ink", id: "waiting" },
    { label: "Pesanan Selesai", value: s?.completed ?? 0, Icon: CheckCheck, cls: "bg-brand-ink text-white", id: "completed" },
    { label: "Omzet (sudah dibayar)", value: rupiah(s?.revenue ?? 0), Icon: Wallet, cls: "bg-card", id: "revenue" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.id} className={cn("rounded-3xl p-5 shadow-sm", c.cls)} data-testid={`admin-stat-${c.id}`}>
            <c.Icon className="size-5 opacity-80" />
            <p className="mt-3 font-mono text-3xl font-black" data-testid={`admin-stat-${c.id}-value`}>{c.value}</p>
            <p className="text-sm font-semibold opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto" data-testid="admin-order-filters">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v)}
            data-testid={`admin-filter-${f.v}`}
            className={cn(
              "shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors",
              filter === f.v ? "border-brand-red bg-brand-red text-white" : "border-border bg-card hover:border-brand-red/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.isLoading && <div className="h-60 animate-pulse rounded-3xl bg-muted" />}
      {!orders.isLoading && list.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed bg-card p-12 text-center text-muted-foreground" data-testid="admin-orders-empty">
          Belum ada pesanan pada filter ini.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((o) => {
          const next = NEXT_ACTION[o.status];
          return (
            <article key={o.id} className="rounded-3xl border bg-card p-5 shadow-sm" data-testid={`admin-order-card-${o.order_number}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl font-black">{o.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    <b className="text-foreground">{o.customer_name}</b> · {DINING_LABEL[o.dining_mode]} · {o.dining_mode === "dine_in" ? "Meja" : "Antrean"} {o.table_number}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                </div>
                <StatusBadge status={o.status} testid={`admin-order-status-${o.order_number}`} />
              </div>
              <div className="mt-3">
                <OrderItemsList items={o.items} />
              </div>
              <div className="flex justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Subtotal {rupiah(o.subtotal)} + layanan {rupiah(o.service_fee)}</span>
                <span className="font-mono text-lg font-black text-brand-red">{rupiah(o.total)}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {next && (
                  <button
                    type="button"
                    onClick={() => setStatus.mutate({ id: o.id, status: next.to })}
                    disabled={setStatus.isPending}
                    data-testid={`admin-order-status-btn-${o.order_number}-${next.to}`}
                    className="flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white transition-[transform,background-color] hover:bg-brand-red-dark active:scale-95 disabled:opacity-60"
                  >
                    <next.Icon className="size-4" /> {next.label}
                  </button>
                )}
                {o.status === "menunggu_pembayaran" && (
                  <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Menunggu pelanggan membayar</span>
                )}
                <Select value={o.status} onValueChange={(v: string) => v !== o.status && setStatus.mutate({ id: o.id, status: v as OrderStatus })}>
                  <SelectTrigger className="h-9 w-48 rounded-full" data-testid={`admin-order-status-select-${o.order_number}`}>
                    <SelectValue>{(v) => STATUS_LABEL[v as OrderStatus] ?? "Ubah status"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FLOW.map((st) => (
                      <SelectItem key={st} value={st} data-testid={`admin-status-option-${st}`}>
                        {STATUS_LABEL[st]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => setReceipt(o)}
                  data-testid={`print-thermal-receipt-btn-${o.order_number}`}
                  className="flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-sm font-bold hover:border-brand-red/50"
                >
                  <Printer className="size-4" /> Struk
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(o)}
                  data-testid={`admin-order-delete-btn-${o.order_number}`}
                  className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" /> Hapus Pesanan
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <ReceiptDialog order={receipt} onClose={() => setReceipt(null)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Hapus pesanan?"
        description={`Pesanan ${toDelete?.order_number ?? ""} akan dihapus permanen.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
