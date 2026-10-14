import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Checkout from "@/pages/Checkout";
import Payment from "@/pages/Payment";
import Tracking from "@/pages/Tracking";
import Admin from "@/pages/Admin";
import { CartProvider } from "@/lib/cart";
import CartSheet from "@/components/CartSheet";
import { Toaster } from "@/components/ui/sonner";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/bayar/:orderNumber" element={<Payment />} />
        <Route path="/lacak" element={<Tracking />} />
        <Route path="/lacak/:orderNumber" element={<Tracking />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <CartSheet />
      <Toaster richColors />
    </CartProvider>
  );
}
