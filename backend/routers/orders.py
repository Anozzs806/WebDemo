from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from lib.auth import require_admin
from lib.db import db
from models.menu import Product
from models.order import (
    SERVICE_FEE,
    Order,
    OrderCreate,
    OrderItem,
    OrderStats,
    SelectedOption,
    StatusUpdate,
)

router = APIRouter(tags=["orders"])

ACTIVE = ["pembayaran_berhasil", "sedang_disiapkan", "siap_diambil"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_order(doc: dict) -> Order:
    for key in ("created_at", "updated_at", "paid_at"):
        if doc.get(key) is not None and doc[key].tzinfo is None:
            doc[key] = doc[key].replace(tzinfo=timezone.utc)
    return Order(**doc)


async def _next_seq(name: str) -> int:
    counter = await db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return counter["seq"]


async def _next_order_number() -> str:
    return f"KS-{await _next_seq('order_number'):04d}"


async def _next_queue_number() -> str:
    return f"A-{(await _next_seq('takeaway_queue') - 1) % 999 + 1:03d}"


def _build_item(product: Product, quantity: int, selections: dict[str, list[str]], note: str) -> OrderItem:
    chosen: list[SelectedOption] = []
    for group in product.option_groups:
        picked_ids = selections.get(group.id, [])
        picked = [c for c in group.choices if c.id in picked_ids]
        if group.type == "single" and len(picked) > 1:
            raise HTTPException(status_code=400, detail=f"Pilih satu saja untuk {group.name}")
        if group.required and group.choices and not picked:
            raise HTTPException(status_code=400, detail=f"{group.name} wajib dipilih untuk {product.name}")
        chosen.extend(SelectedOption(group=group.name, choice=c.name, price=c.price) for c in picked)
    unit_price = product.price + sum(s.price for s in chosen)
    return OrderItem(
        product_id=product.id,
        product_name=product.name,
        base_price=product.price,
        quantity=quantity,
        selections=chosen,
        note=note.strip(),
        unit_price=unit_price,
        line_total=unit_price * quantity,
    )


@router.post("/orders", response_model=Order)
async def create_order(body: OrderCreate):
    if body.dining_mode == "dine_in" and not body.table_number.strip():
        raise HTTPException(status_code=400, detail="Nomor meja wajib diisi untuk makan di tempat")
    items: list[OrderItem] = []
    for it in body.items:
        doc = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not doc or not doc.get("available", True):
            raise HTTPException(status_code=400, detail="Ada produk yang sudah tidak tersedia")
        items.append(_build_item(Product(**doc), it.quantity, it.selections, it.note))
    subtotal = sum(i.line_total for i in items)
    now = _now()
    order = Order(
        order_number=await _next_order_number(),
        customer_name=body.customer_name.strip(),
        table_number=body.table_number.strip() if body.dining_mode == "dine_in" else await _next_queue_number(),
        dining_mode=body.dining_mode,
        items=items,
        subtotal=subtotal,
        service_fee=SERVICE_FEE,
        total=subtotal + SERVICE_FEE,
        created_at=now,
        updated_at=now,
    )
    await db.orders.insert_one(order.model_dump())
    return order


async def _get(order_number: str) -> Order:
    doc = await db.orders.find_one({"order_number": order_number.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return _to_order(doc)


@router.get("/orders/{order_number}", response_model=Order)
async def get_order(order_number: str):
    return await _get(order_number)


@router.post("/orders/{order_number}/pay", response_model=Order)
async def simulate_payment(order_number: str):
    order = await _get(order_number)
    if order.status != "menunggu_pembayaran":
        return order
    now = _now()
    await db.orders.update_one(
        {"id": order.id},
        {"$set": {"status": "pembayaran_berhasil", "paid_at": now, "updated_at": now}},
    )
    return await _get(order_number)


# ---------- Admin ----------
@router.get("/admin/orders", response_model=list[Order], dependencies=[Depends(require_admin)])
async def admin_orders():
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [_to_order(d) for d in docs]


@router.get("/admin/stats", response_model=OrderStats, dependencies=[Depends(require_admin)])
async def admin_stats():
    docs = await db.orders.find({}, {"_id": 0, "status": 1, "total": 1}).to_list(5000)
    count = lambda *s: sum(1 for d in docs if d["status"] in s)  # noqa: E731
    return OrderStats(
        total=len(docs),
        waiting_payment=count("menunggu_pembayaran"),
        active=count(*ACTIVE),
        ready=count("siap_diambil"),
        completed=count("selesai"),
        revenue=sum(d["total"] for d in docs if d["status"] != "menunggu_pembayaran"),
    )


@router.patch("/admin/orders/{id}/status", response_model=Order, dependencies=[Depends(require_admin)])
async def update_status(id: str, body: StatusUpdate):
    now = _now()
    update: dict = {"status": body.status, "updated_at": now}
    if body.status != "menunggu_pembayaran":
        doc = await db.orders.find_one({"id": id}, {"paid_at": 1})
        if doc and not doc.get("paid_at"):
            update["paid_at"] = now
    else:
        update["paid_at"] = None
    doc = await db.orders.find_one_and_update(
        {"id": id}, {"$set": update}, projection={"_id": 0}, return_document=ReturnDocument.AFTER
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return _to_order(doc)


@router.delete("/admin/orders/{id}", dependencies=[Depends(require_admin)])
async def delete_order(id: str):
    res = await db.orders.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return {"ok": True}
