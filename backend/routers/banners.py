from fastapi import APIRouter, Depends, HTTPException, Request

from lib.auth import is_admin, require_admin
from lib.db import db
from models.banner import (
    DEFAULT_PROMO_TEXTS,
    MAX_ACTIVE_BANNERS,
    Banner,
    BannerInput,
    BannerReorder,
    PromoTexts,
)

router = APIRouter(tags=["banners"])

PROMO_KEY = "promo_texts"


@router.get("/banners", response_model=list[Banner])
async def list_banners(request: Request, all: bool = False):
    docs = await db.banners.find({}, {"_id": 0}).sort("sort_order", 1).to_list(200)
    banners = [Banner(**d) for d in docs]
    if all and is_admin(request):
        return banners
    # Public: only active banners whose linked product still exists and is available.
    ids = [b.product_id for b in banners if b.active]
    available = {
        p["id"]
        for p in await db.products.find({"id": {"$in": ids}, "available": True}, {"id": 1}).to_list(200)
    }
    return [b for b in banners if b.active and b.product_id in available][:MAX_ACTIVE_BANNERS]


async def _check(body: BannerInput, exclude_id: str | None = None) -> None:
    if not await db.products.find_one({"id": body.product_id}):
        raise HTTPException(status_code=400, detail="Produk unggulan tidak ditemukan")
    if body.active:
        query: dict = {"active": True}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}
        if await db.banners.count_documents(query) >= MAX_ACTIVE_BANNERS:
            raise HTTPException(
                status_code=400,
                detail=f"Maksimal {MAX_ACTIVE_BANNERS} banner aktif. Nonaktifkan banner lain dulu.",
            )


@router.post("/banners", response_model=Banner, dependencies=[Depends(require_admin)])
async def create_banner(body: BannerInput):
    await _check(body)
    last = await db.banners.find_one({}, {"sort_order": 1}, sort=[("sort_order", -1)])
    banner = Banner(**body.model_dump(), sort_order=(last["sort_order"] + 1) if last else 0)
    await db.banners.insert_one(banner.model_dump())
    return banner


@router.put("/banners/reorder", response_model=list[Banner], dependencies=[Depends(require_admin)])
async def reorder_banners(body: BannerReorder):
    for i, bid in enumerate(body.ids):
        await db.banners.update_one({"id": bid}, {"$set": {"sort_order": i}})
    docs = await db.banners.find({}, {"_id": 0}).sort("sort_order", 1).to_list(200)
    return [Banner(**d) for d in docs]


@router.put("/banners/{id}", response_model=Banner, dependencies=[Depends(require_admin)])
async def update_banner(id: str, body: BannerInput):
    existing = await db.banners.find_one({"id": id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Banner tidak ditemukan")
    await _check(body, exclude_id=id)
    await db.banners.update_one({"id": id}, {"$set": body.model_dump()})
    return Banner(**{**existing, **body.model_dump()})


@router.delete("/banners/{id}", dependencies=[Depends(require_admin)])
async def delete_banner(id: str):
    res = await db.banners.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner tidak ditemukan")
    return {"ok": True}


# ---------- Running promo text ----------
@router.get("/promo-texts", response_model=PromoTexts)
async def get_promo_texts():
    doc = await db.settings.find_one({"key": PROMO_KEY}, {"_id": 0})
    return PromoTexts(items=doc["items"] if doc else DEFAULT_PROMO_TEXTS)


@router.put("/promo-texts", response_model=PromoTexts, dependencies=[Depends(require_admin)])
async def set_promo_texts(body: PromoTexts):
    items = [t.strip() for t in body.items if t.strip()]
    if any(len(t) > 60 for t in items):
        raise HTTPException(status_code=400, detail="Setiap kalimat promo maksimal 60 karakter")
    await db.settings.update_one({"key": PROMO_KEY}, {"$set": {"items": items}}, upsert=True)
    return PromoTexts(items=items)
