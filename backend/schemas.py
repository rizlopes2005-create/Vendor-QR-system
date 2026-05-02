from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MenuItemBase(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    is_available: bool = True

class MenuItemCreate(MenuItemBase):
    pass

class MenuItem(MenuItemBase):
    id: int
    class Config:
        from_attributes = True

class OrderItemBase(BaseModel):
    menu_item_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    menu_item: MenuItem
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    total_amount: float
    payment_method: str

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    token_number: int
    status: str
    timestamp: datetime
    is_priority: bool
    items: List[OrderItem]
    
    class Config:
        from_attributes = True

class VendorBase(BaseModel):
    name: str
    upi_id: str
    logo_url: Optional[str] = None

class Vendor(VendorBase):
    id: int
    class Config:
        from_attributes = True

class RatingCreate(BaseModel):
    order_id: int
    stars: int
    comment: Optional[str] = None

class Rating(RatingCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True
