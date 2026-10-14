import uuid
from typing import Literal

from pydantic import BaseModel, Field


def new_id() -> str:
    return str(uuid.uuid4())


class Category(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    sort_order: int = 0


class CategoryInput(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    sort_order: int = 0


class OptionChoice(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str = Field(min_length=1)
    price: int = Field(default=0, ge=0)


class OptionGroup(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str = Field(min_length=1)
    # single = varian (pilih satu), multiple = topping (boleh lebih dari satu)
    type: Literal["single", "multiple"] = "single"
    required: bool = True
    choices: list[OptionChoice] = []


class Product(BaseModel):
    id: str = Field(default_factory=new_id)
    category_id: str
    name: str
    description: str = ""
    price: int
    image: str = ""
    available: bool = True
    option_groups: list[OptionGroup] = []


class ProductInput(BaseModel):
    category_id: str
    name: str = Field(min_length=1, max_length=100)
    description: str = ""
    price: int = Field(ge=0)
    image: str = ""
    available: bool = True
    option_groups: list[OptionGroup] = []
