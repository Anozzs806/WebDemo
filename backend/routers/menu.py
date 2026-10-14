from fastapi import APIRouter, Depends, HTTPException, Request

from lib.auth import is_admin, require_admin
from lib.db import db
from models.menu import Category, CategoryInput, Product, ProductInput

router = APIRouter(tags=["menu"])


# ---------- Categories ----------
@router.get("/categories", response_model=list[Category])
async def list_categories():
    docs = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(500)
    return [Category(**d) for d in docs]


@router.post("/categories", response_model=Category, dependencies=[Depends(require_admin)])
async def create_category(body: CategoryInput):
    cat = Category(**body.model_dump())
    await db.categories.insert_one(cat.model_dump())
    return cat


@router.put("/categories/{id}", response_model=Category, dependencies=[Depends(require_admin)])
async def update_category(id: str, body: CategoryInput):
    res = await db.categories.update_one({"id": id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    return Category(id=id, **body.model_dump())


@router.delete("/categories/{id}", dependencies=[Depends(require_admin)])
async def delete_category(id: str):
    if await db.products.count_documents({"category_id": id}) > 0:
        raise HTTPException(
            status_code=400, detail="Kategori masih memiliki produk. Pindahkan/hapus produknya dulu."
        )
    res = await db.categories.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    return {"ok": True}


# ---------- Products ----------
@router.get("/products", response_model=list[Product])
async def list_products(request: Request, all: bool = False):
    query = {} if (all and is_admin(request)) else {"available": True}
    docs = await db.products.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    return [Product(**d) for d in docs]


async def _check_category(category_id: str) -> None:
    if not await db.categories.find_one({"id": category_id}):
        raise HTTPException(status_code=400, detail="Kategori tidak valid")


@router.post("/products", response_model=Product, dependencies=[Depends(require_admin)])
async def create_product(body: ProductInput):
    await _check_category(body.category_id)
    product = Product(**body.model_dump())
    await db.products.insert_one(product.model_dump())
    return product


@router.put("/products/{id}", response_model=Product, dependencies=[Depends(require_admin)])
async def update_product(id: str, body: ProductInput):
    await _check_category(body.category_id)
    data = body.model_dump()
    res = await db.products.update_one({"id": id}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return Product(id=id, **data)


@router.delete("/products/{id}", dependencies=[Depends(require_admin)])
async def delete_product(id: str):
    res = await db.products.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return {"ok": True}
