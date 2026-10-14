import { useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";
import { DINING_LABEL, formatDateTime, RESTAURANT_NAME, rupiah, STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

type Width = 58 | 80;

export function ThermalReceipt({ order, width }: { order: Order; width: Width }) {
  const small = width === 58;
  const paid = order.status !== "menunggu_pembayaran";
  const Sep = () => <div className="my-1.5 border-t border-dashed border-black" />;
  return (
    <div
      className={cn("bg-white font-mono leading-snug text-black", small ? "text-[10px]" : "text-[12px]")}
      style={{ width: `${width}mm`, padding: "3mm" }}
      data-testid="thermal-receipt"
    >
      <div className="text-center">
        <p className={cn("font-extrabold uppercase", small ? "text-[14px]" : "text-[17px]")}>{RESTAURANT_NAME}</p>
        <p>Restoran Cepat Saji (Demo)</p>
        <p>Jl. Contoh No. 1, Jakarta</p>
      </div>
      <Sep />
      <p className={cn("text-center font-extrabold", small ? "text-[15px]" : "text-[19px]")} data-testid="receipt-order-number">{order.order_number}</p>
      <Sep />
      <Line l="Tanggal" r={formatDateTime(order.created_at)} />
      <Line l="Pelanggan" r={order.customer_name} />
      <Line l={order.dining_mode === "dine_in" ? "Meja" : "Antrean"} r={order.table_number} />
      <Line l="Tipe" r={DINING_LABEL[order.dining_mode]} />
      <Sep />
      {order.items.map((it, i) => (
        <div key={i} className="mb-1">
          <p className="font-bold">{it.product_name}</p>
          <Line l={`${it.quantity} x ${rupiah(it.unit_price)}`} r={rupiah(it.line_total)} />
          {it.selections.map((s, j) => (
            <p key={j} className="pl-2">
              - {s.group}: {s.choice}
              {s.price > 0 ? ` (+${s.price.toLocaleString("id-ID")})` : ""}
            </p>
          ))}
          {it.note && <p className="pl-2 italic">* {it.note}</p>}
        </div>
      ))}
      <Sep />
      <Line l="Subtotal" r={rupiah(order.subtotal)} />
      <Line l="Biaya Layanan" r={rupiah(order.service_fee)} />
      <div className={cn("font-extrabold", small ? "text-[12px]" : "text-[14px]")}>
        <Line l="TOTAL" r={rupiah(order.total)} />
      </div>
      <Sep />
      <Line l="Pembayaran" r="QR Demo" />
      <Line l="Status Bayar" r={paid ? "LUNAS" : "BELUM DIBAYAR"} />
      <Line l="Status" r={STATUS_LABEL[order.status]} />
      <Sep />
      <p className="text-center">Terima kasih & selamat menikmati!</p>
      <p className="text-center">*** Struk demo, bukan bukti pajak ***</p>
    </div>
  );
}

function Line({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{l}</span>
      <span className="text-right">{r}</span>
    </div>
  );
}

export function ReceiptDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const [width, setWidth] = useState<Width>(58);
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="receipt-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold">Cetak Struk</DialogTitle>
          <DialogDescription>Pilih ukuran kertas printer thermal, lalu cetak.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          {([58, 80] as Width[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              data-testid={`receipt-width-${w}-btn`}
              className={cn(
                "flex-1 rounded-full border-2 py-2 text-sm font-bold transition-colors",
                width === w ? "border-brand-red bg-brand-red text-white" : "border-border hover:border-brand-red/40",
              )}
            >
              {w} mm
            </button>
          ))}
        </div>
        <div className="max-h-[50vh] overflow-auto rounded-xl bg-zinc-200 p-4">
          <div className="mx-auto w-fit shadow-lg">{order && <ThermalReceipt order={order} width={width} />}</div>
        </div>
        <Button onClick={() => window.print()} className="h-11 rounded-full font-bold" data-testid="receipt-print-btn">
          <Printer className="size-4" /> Cetak Sekarang
        </Button>
        {order &&
          createPortal(
            <div className="print-receipt">
              <style>{`@page { size: ${width}mm auto; margin: 0; }`}</style>
              <ThermalReceipt order={order} width={width} />
            </div>,
            document.body,
          )}
      </DialogContent>
    </Dialog>
  );
}
