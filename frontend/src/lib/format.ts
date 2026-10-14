import { ApiError } from "@/lib/api";
import type { OrderStatus } from "@/lib/types";

export const RESTAURANT_NAME = "Kilat Santap";
export const SERVICE_FEE = 2000; // mirrors backend models/order.py SERVICE_FEE

export const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const STATUS_FLOW: OrderStatus[] = [
  "menunggu_pembayaran",
  "pembayaran_berhasil",
  "sedang_disiapkan",
  "siap_diambil",
  "selesai",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  pembayaran_berhasil: "Pembayaran Berhasil",
  sedang_disiapkan: "Sedang Disiapkan",
  siap_diambil: "Siap Diambil",
  selesai: "Selesai",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-amber-100 text-amber-900 ring-amber-300",
  pembayaran_berhasil: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  sedang_disiapkan: "bg-sky-100 text-sky-900 ring-sky-300",
  siap_diambil: "bg-violet-100 text-violet-900 ring-violet-300",
  selesai: "bg-zinc-200 text-zinc-800 ring-zinc-300",
};

export const DINING_LABEL = { dine_in: "Makan di Tempat", takeaway: "Bawa Pulang" } as const;

export function errMsg(e: unknown, fallback = "Terjadi kesalahan, coba lagi."): string {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (body && typeof body.detail === "string") return body.detail;
    if (body && Array.isArray(body.detail)) return "Data yang diisi belum lengkap atau tidak valid.";
  }
  return fallback;
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
