import os

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from lib.auth import COOKIE_NAME, admin_token, is_admin

router = APIRouter(prefix="/auth", tags=["auth"])


class PinLogin(BaseModel):
    pin: str


class AdminMe(BaseModel):
    is_admin: bool


@router.post("/login", response_model=AdminMe)
async def login(body: PinLogin, response: Response):
    if body.pin != os.environ.get("ADMIN_PIN", "1234"):
        raise HTTPException(status_code=401, detail="PIN salah")
    response.set_cookie(
        COOKIE_NAME, admin_token(), httponly=True, samesite="lax", max_age=60 * 60 * 12, path="/"
    )
    return AdminMe(is_admin=True)


@router.post("/logout", response_model=AdminMe)
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return AdminMe(is_admin=False)


@router.get("/me", response_model=AdminMe)
async def me(request: Request):
    return AdminMe(is_admin=is_admin(request))
