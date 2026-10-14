"""Sample menu for Kilat Santap. seed_if_empty() runs at startup so the demo works immediately."""

from lib.db import db
from models.banner import Banner
from models.menu import Category, OptionChoice, OptionGroup, Product

U = "https://images.unsplash.com/"
Q = "?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
IMG = {
    "ayam1": f"{U}photo-1569058242253-92a9c755a0ec{Q}",
    "ayam2": f"{U}photo-1586793783658-261cddf883ef{Q}",
    "ayam3": f"{U}photo-1562967916-eb82221dfb92{Q}",
    "ayam4": f"{U}photo-1638439430466-b2bb7fdc1d67{Q}",
    "burger1": f"{U}photo-1568901346375-23c9450c58cd{Q}",
    "burger2": f"{U}photo-1586190848861-99aa4a171e90{Q}",
    "burger3": f"{U}photo-1572802419224-296b0aeee0d9{Q}",
    "burger4": f"{U}photo-1610440042657-612c34d95e9f{Q}",
    "fries1": f"{U}photo-1518013431117-eb1465fa5752{Q}",
    "fries2": f"{U}photo-1598679253544-2c97992403ea{Q}",
    "fries3": f"{U}photo-1630384060421-cb20d0e0649d{Q}",
    "nasi1": f"{U}photo-1679279726946-a158b8bcaa23{Q}",
    "nasi2": f"{U}photo-1682566509568-ded8649b26bb{Q}",
    "teh": f"{U}photo-1556679343-c7306c1976bc{Q}",
    "teh2": f"{U}photo-1533007716222-4b465613a984{Q}",
    "cola": f"{U}photo-1544241907-f3f1f5ded15a{Q}",
    "dessert1": f"{U}photo-1597249536924-b226b1a1259d{Q}",
    "dessert2": f"{U}photo-1543255006-d6395b6f1171{Q}",
    "dessert3": f"{U}photo-1598268121084-c8f7126e0cef{Q}",
}


def g(name: str, choices: list[tuple[str, int]], type_: str = "single", required: bool = True) -> OptionGroup:
    return OptionGroup(
        name=name,
        type=type_,  # type: ignore[arg-type]
        required=required,
        choices=[OptionChoice(name=n, price=p) for n, p in choices],
    )


def paket_ayam() -> OptionGroup:
    return g("Pilihan Paket", [("Ayam Saja", 0), ("Ayam + Nasi", 6000), ("Paket Ayam + Nasi + Minuman", 12000)])


def sambal() -> OptionGroup:
    return g("Sambal", [("Tidak Pakai Sambal", 0), ("Sambal Level 1", 0), ("Sambal Level 2", 1000), ("Sambal Level 3", 2000)])


def bagian() -> OptionGroup:
    return g("Bagian Ayam", [("Dada", 2000), ("Paha", 0)])


def topping_ayam() -> OptionGroup:
    return g(
        "Topping",
        [("Keju Leleh", 4000), ("Telur Mata Sapi", 5000), ("Sambal Matah", 3000), ("Bawang Goreng", 2000)],
        "multiple",
        False,
    )


def topping_burger() -> OptionGroup:
    return g(
        "Topping",
        [("Ekstra Keju", 4000), ("Ekstra Patty", 12000), ("Telur", 5000), ("Jalapeno", 3000)],
        "multiple",
        False,
    )


def teh_opts() -> list[OptionGroup]:
    return [
        g("Gula", [("Manis", 0), ("Tawar", 0)]),
        g("Suhu", [("Es", 0), ("Hangat", 0)]),
        g("Ukuran", [("Regular", 0), ("Large", 4000)]),
    ]


def size_opts() -> OptionGroup:
    return g("Ukuran", [("Regular", 0), ("Large", 5000)])


CATEGORIES = [
    "Paket Hemat",
    "Ayam Goreng",
    "Burger",
    "Kentang Goreng",
    "Nasi",
    "Minuman",
    "Dessert",
]


def build_products(cat: dict[str, str]) -> list[Product]:
    P = Product
    return [
        P(category_id=cat["Paket Hemat"], name="Paket Hemat Kilat 1", price=25000, image=IMG["ayam1"],
          description="1 ayam goreng krispi, nasi hangat, dan es teh manis. Pas untuk makan siang.",
          option_groups=[sambal(), bagian(), g("Minuman", [("Es Teh Manis", 0), ("Kilat Cola", 3000)])]),
        P(category_id=cat["Paket Hemat"], name="Paket Burger Combo", price=42000, image=IMG["burger4"],
          description="Cheeseburger klasik, kentang goreng regular, dan minuman dingin pilihan.",
          option_groups=[g("Minuman", [("Es Teh Manis", 0), ("Kilat Cola", 3000)]), size_opts(), topping_burger()]),
        P(category_id=cat["Paket Hemat"], name="Paket Keluarga Ber-4", price=119000, image=IMG["ayam2"],
          description="6 potong ayam, 4 nasi, 2 kentang goreng, dan 4 minuman. Hemat untuk ramai-ramai.",
          option_groups=[sambal()]),
        P(category_id=cat["Ayam Goreng"], name="Ayam Krispi Kilat", price=17000, image=IMG["ayam3"],
          description="Ayam dimarinasi bumbu rahasia 12 jam, digoreng renyah keemasan.",
          option_groups=[paket_ayam(), sambal(), bagian(), topping_ayam()]),
        P(category_id=cat["Ayam Goreng"], name="Ayam Geprek Sambal Bawang", price=20000, image=IMG["ayam4"],
          description="Ayam krispi digeprek dengan sambal bawang pedas khas Kilat Santap.",
          option_groups=[paket_ayam(), sambal(), bagian(), topping_ayam()]),
        P(category_id=cat["Ayam Goreng"], name="Bucket Ayam 5 Potong", price=79000, image=IMG["ayam2"],
          description="5 potong ayam krispi campur, cocok dinikmati bersama.",
          option_groups=[sambal(), topping_ayam()]),
        P(category_id=cat["Burger"], name="Kilat Cheeseburger", price=28000, image=IMG["burger1"],
          description="Patty sapi panggang, keju cheddar leleh, selada, tomat, dan saus spesial.",
          option_groups=[g("Kematangan", [("Medium", 0), ("Well Done", 0)]), topping_burger()]),
        P(category_id=cat["Burger"], name="Double Monster Burger", price=45000, image=IMG["burger3"],
          description="Dua patty sapi tebal, dobel keju, acar, dan saus Kilat yang creamy.",
          option_groups=[topping_burger()]),
        P(category_id=cat["Burger"], name="Crispy Chicken Burger", price=30000, image=IMG["burger2"],
          description="Fillet ayam krispi, mayones wijen, dan selada renyah di roti panggang.",
          option_groups=[sambal(), topping_burger()]),
        P(category_id=cat["Kentang Goreng"], name="Kentang Goreng Original", price=15000, image=IMG["fries1"],
          description="Kentang goreng renyah bertabur garam laut.",
          option_groups=[size_opts(), g("Saus", [("Saus Tomat", 0), ("Saus Sambal", 0), ("Mayones", 2000), ("Saus Keju", 4000)], "multiple", False)]),
        P(category_id=cat["Kentang Goreng"], name="Shake Fries Keju Pedas", price=19000, image=IMG["fries2"],
          description="Kentang goreng dikocok dengan bumbu keju pedas spesial.",
          option_groups=[size_opts(), g("Bumbu", [("Keju", 0), ("Balado", 0), ("Barbeque", 0)])]),
        P(category_id=cat["Kentang Goreng"], name="Loaded Fries", price=27000, image=IMG["fries3"],
          description="Kentang goreng dengan saus keju, daging cincang, dan daun bawang.",
          option_groups=[topping_burger()]),
        P(category_id=cat["Nasi"], name="Nasi Putih", price=6000, image=IMG["nasi2"],
          description="Nasi putih pulen hangat.", option_groups=[g("Porsi", [("Normal", 0), ("Jumbo", 3000)])]),
        P(category_id=cat["Nasi"], name="Rice Bowl Ayam Teriyaki", price=26000, image=IMG["nasi1"],
          description="Nasi hangat dengan potongan ayam krispi saus teriyaki dan nori.",
          option_groups=[sambal(), topping_ayam()]),
        P(category_id=cat["Minuman"], name="Teh Kilat", price=7000, image=IMG["teh"],
          description="Teh melati seduh segar. Pilih manis/tawar, es/hangat.", option_groups=teh_opts()),
        P(category_id=cat["Minuman"], name="Teh Lemon Segar", price=10000, image=IMG["teh2"],
          description="Teh dengan perasan lemon asli yang menyegarkan.", option_groups=teh_opts()),
        P(category_id=cat["Minuman"], name="Kilat Cola", price=10000, image=IMG["cola"],
          description="Minuman soda dingin pelepas dahaga.", option_groups=[size_opts(), g("Es", [("Normal Es", 0), ("Sedikit Es", 0), ("Tanpa Es", 0)])]),
        P(category_id=cat["Dessert"], name="Sundae Stroberi", price=12000, image=IMG["dessert1"],
          description="Es krim vanila lembut dengan saus stroberi.",
          option_groups=[g("Topping", [("Choco Chips", 3000), ("Kacang Almond", 4000), ("Oreo", 4000)], "multiple", False)]),
        P(category_id=cat["Dessert"], name="Es Krim Cokelat Leleh", price=15000, image=IMG["dessert2"],
          description="Es krim vanila dengan siraman cokelat hangat dan buah segar.",
          option_groups=[g("Topping", [("Choco Chips", 3000), ("Kacang Almond", 4000), ("Oreo", 4000)], "multiple", False)]),
        P(category_id=cat["Dessert"], name="Kopi Jelly Float", price=18000, image=IMG["dessert3"],
          description="Jelly kopi dengan susu segar dan dua scoop es krim vanila.", option_groups=[]),
    ]


async def seed_banners(force: bool = False) -> bool:
    """Default hero banners, inserted once (flag in settings) so deleting all banners sticks."""
    if force:
        await db.banners.delete_many({})
        await db.settings.delete_one({"key": "banners_seeded"})
    if await db.settings.find_one({"key": "banners_seeded"}):
        return False
    by_name = {p["name"]: p["id"] for p in await db.products.find({}, {"name": 1, "id": 1}).to_list(1000)}
    defaults = [
        Banner(
            product_id=by_name.get("Kilat Cheeseburger", ""),
            label="Cepat, Renyah, Mantap!",
            title="Lapar? Pesan sekarang,",
            highlight="siap dalam kilat.",
            subtitle="Pilih menu favorit, atur sambal & topping sesukamu, bayar pakai QR demo, lalu pantau pesananmu sampai siap diambil.",
            sort_order=0,
        ),
        Banner(
            product_id=by_name.get("Ayam Krispi Kilat", ""),
            label="Favorit Pelanggan",
            title="Renyahnya bikin nagih,",
            highlight="ayam krispi kilat!",
            subtitle="Dimarinasi 12 jam dengan bumbu rahasia, digoreng setiap ada pesanan. Pilih dada atau paha, level sambal sesukamu.",
            sort_order=1,
        ),
        Banner(
            product_id=by_name.get("Paket Hemat Kilat 1", ""),
            label="Paling Hemat",
            title="Makan kenyang,",
            highlight="dompet tetap aman.",
            subtitle="Paket ayam krispi, nasi hangat, dan es teh manis dalam satu harga hemat. Cocok untuk makan siang.",
            sort_order=2,
        ),
    ]
    docs = [b.model_dump() for b in defaults if b.product_id]
    if docs:
        await db.banners.insert_many(docs)
    await db.settings.update_one({"key": "banners_seeded"}, {"$set": {"value": True}}, upsert=True)
    return True


async def seed(reset: bool = False) -> bool:
    """Insert sample categories/products. Returns True if seeded."""
    if reset:
        await db.categories.delete_many({})
        await db.products.delete_many({})
    if await db.categories.count_documents({}) > 0:
        await seed_banners()
        return False
    cats = [Category(name=n, sort_order=i) for i, n in enumerate(CATEGORIES)]
    await db.categories.insert_many([c.model_dump() for c in cats])
    by_name = {c.name: c.id for c in cats}
    await db.products.insert_many([p.model_dump() for p in build_products(by_name)])
    await seed_banners(force=True)  # product ids changed, relink banners
    return True
