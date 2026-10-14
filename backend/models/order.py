from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from models.menu import new_id

OrderStatus = Literal[
    "menunggu_pembayaran",
    "pembayaran_berhasil",
    "sedang_disiapkan",
    "siap_diambil",
    "selesai",
]

SERVICE_FEE = 2000


class OrderItemInput(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)
    # group_id -> list of choice ids
    selections: dict[str, list[str]] = {}
    note: str = ""


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=60)
    # required for dine_in; ignored for takeaway (server generates a queue number)
    table_number: str = Field(default="", max_length=20)
    dining_mode: Literal["dine_in", "takeaway"] = "dine_in"
    items: list[OrderItemInput] = Field(min_length=1)


class SelectedOption(BaseModel):
    group: str
    choice: str
    price: int


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    base_price: int
    quantity: int
    selections: list[SelectedOption] = []
    note: str = ""
    unit_price: int
    line_total: int


class Order(BaseModel):
    id: str = Field(default_factory=new_id)
    order_number: str
    customer_name: str
    table_number: str
    dining_mode: Literal["dine_in", "takeaway"]
    items: list[OrderItem]
    subtotal: int
    service_fee: int
    total: int
    status: OrderStatus = "menunggu_pembayaran"
    created_at: datetime
    paid_at: datetime | None = None
    updated_at: datetime


class StatusUpdate(BaseModel):
    status: OrderStatus


class OrderStats(BaseModel):
    total: int
    waiting_payment: int
    active: int
    ready: int
    completed: int
    revenue: int
