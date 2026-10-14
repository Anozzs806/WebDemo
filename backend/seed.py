"""Reset menu to the sample data: `cd /app/backend && python seed.py` (orders are kept)."""

import asyncio

from lib.db import ensure_indexes
from seed_data import seed


async def main() -> None:
    await seed(reset=True)
    await ensure_indexes()
    print("Menu contoh Kilat Santap berhasil dimuat.")


if __name__ == "__main__":
    asyncio.run(main())
