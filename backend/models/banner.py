from pydantic import BaseModel, Field

from models.menu import new_id

MAX_ACTIVE_BANNERS = 6
MAX_PROMO_TEXTS = 8


class BannerInput(BaseModel):
    product_id: str
    title: str = Field(min_length=1, max_length=40)
    highlight: str = Field(default="", max_length=40)
    subtitle: str = Field(default="", max_length=160)
    label: str = Field(default="", max_length=30)
    active: bool = True


class Banner(BannerInput):
    id: str = Field(default_factory=new_id)
    sort_order: int = 0


class BannerReorder(BaseModel):
    ids: list[str]


class PromoTexts(BaseModel):
    items: list[str] = Field(default=[], max_length=MAX_PROMO_TEXTS)


DEFAULT_PROMO_TEXTS = [
    "Paket Hemat mulai Rp 25.000",
    "Ayam krispi digoreng setiap pesanan",
    "Bayar pakai QR (demo)",
    "Lacak pesanan secara langsung",
]
