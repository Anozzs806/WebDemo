// Hand-written mirrors of backend/models/*.py — keep in sync.

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface CategoryInput {
  name: string;
  sort_order: number;
}

export interface OptionChoice {
  id: string;
  name: string;
  price: number;
}

export type OptionGroupType = "single" | "multiple";

export interface OptionGroup {
  id: string;
  name: string;
  type: OptionGroupType;
  required: boolean;
  choices: OptionChoice[];
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  option_groups: OptionGroup[];
}

export type ProductInput = Omit<Product, "id">;

export type OrderStatus =
  | "menunggu_pembayaran"
  | "pembayaran_berhasil"
  | "sedang_disiapkan"
  | "siap_diambil"
  | "selesai";

export type DiningMode = "dine_in" | "takeaway";

export interface SelectedOption {
  group: string;
  choice: string;
  price: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  base_price: number;
  quantity: number;
  selections: SelectedOption[];
  note: string;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  table_number: string;
  dining_mode: DiningMode;
  items: OrderItem[];
  subtotal: number;
  service_fee: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
  selections: Record<string, string[]>;
  note: string;
}

export interface OrderCreate {
  customer_name: string;
  table_number: string;
  dining_mode: DiningMode;
  items: OrderItemInput[];
}

export interface OrderStats {
  total: number;
  waiting_payment: number;
  active: number;
  ready: number;
  completed: number;
  revenue: number;
}

export interface AdminMe {
  is_admin: boolean;
}

export interface BannerInput {
  product_id: string;
  title: string;
  highlight: string;
  subtitle: string;
  label: string;
  active: boolean;
}

export interface Banner extends BannerInput {
  id: string;
  sort_order: number;
}

export interface PromoTexts {
  items: string[];
}
