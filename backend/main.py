from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict
import json
import asyncio

import models
import schemas
import database
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Arun Bites - QR Ordering System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Order Queue Logic
def calculate_priority(order: models.Order, items_count: int):
    # Higher priority for smaller orders (SJF) and Prepaid (UPI)
    priority_score = 0
    if items_count <= 2:
        priority_score += 10
    if order.payment_method == "UPI":
        priority_score += 5
    return priority_score > 0

# Endpoints
@app.get("/menu", response_model=List[schemas.MenuItem])
def get_menu(db: Session = Depends(get_db)):
    return db.query(models.MenuItem).all()

@app.post("/menu", response_model=schemas.MenuItem)
def add_menu_item(item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    new_item = models.MenuItem(**item.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.post("/orders", response_model=schemas.Order)
async def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Calculate token number (last order token + 1)
    last_order = db.query(models.Order).order_by(models.Order.id.desc()).first()
    token_number = (last_order.token_number % 100) + 1 if last_order else 1
    
    new_order = models.Order(
        token_number=token_number,
        total_amount=order_data.total_amount,
        payment_method=order_data.payment_method,
        status="Pending"
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    items_count = 0
    for item in order_data.items:
        order_item = models.OrderItem(
            order_id=new_order.id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity
        )
        items_count += item.quantity
        db.add(order_item)
    
    new_order.is_priority = calculate_priority(new_order, items_count)
    db.commit()
    db.refresh(new_order)
    
    # Notify Vendor via WebSocket
    order_dict = schemas.Order.model_validate(new_order).model_dump()
    # Convert datetime to string for JSON serialization
    order_dict['timestamp'] = order_dict['timestamp'].isoformat()
    await manager.broadcast(json.dumps({"type": "NEW_ORDER", "order": order_dict}))
    
    return new_order

@app.get("/orders", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db)):
    # Sorting logic: Priority first, then FCFS (timestamp)
    # But SJF is usually for the kitchen, so we return orders as they come
    # but the vendor can see which ones are priority.
    return db.query(models.Order).order_by(models.Order.status == "Pending", models.Order.is_priority.desc(), models.Order.timestamp.asc()).all()

@app.patch("/orders/{order_id}/status")
async def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    db.commit()
    
    # Notify Customer/Vendor via WebSocket
    await manager.broadcast(json.dumps({
        "type": "STATUS_UPDATE", 
        "order_id": order_id, 
        "status": status,
        "token": order.token_number
    }))
    
    return {"message": "Status updated"}

@app.get("/orders/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# WebSocket Route
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Seed Data
@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    if db.query(models.MenuItem).count() > 0:
        return {"message": "Already seeded"}
    
    items = [
        # Burgers
        models.MenuItem(name="Beast Burger", description="Signature double patty with melting cheese and secret sauce", price=149.0, category="Burgers", image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Mexi-Zing Burger", description="Spicy jalapeno patty with salsa and crunchy nachos", price=129.0, category="Burgers", image_url="https://images.unsplash.com/photo-1582196016295-f8c499b33b0a?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Crispy Paneer Burger", description="Golden fried paneer slab with herb mayo", price=110.0, category="Burgers", image_url="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80"),
        
        # Pizzas
        models.MenuItem(name="Supreme Symphony", description="Loaded with olives, capsicum, corn and premium mozzarella", price=299.0, category="Pizza", image_url="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Pepperoni Paradise", description="Classic smoked pepperoni with extra cheese pulling delight", price=349.0, category="Pizza", image_url="https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Garden Fresh Pizza", description="Farm-picked vegetables with a thin crust base", price=249.0, category="Pizza", image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"),
        
        # Rolls & Snacks
        models.MenuItem(name="Peri-Peri Wrap", description="Juicy chicken/paneer wrap with spicy peri-peri dust", price=89.0, category="Rolls", image_url="https://images.unsplash.com/photo-1626700051175-65686c5de224?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Cheese Corn Balls", description="Melt-in-mouth cheesy centers with a crunchy exterior", price=75.0, category="Snacks", image_url="https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Loaded Nachos", description="Mexican nachos topped with beans, cheese and cream", price=120.0, category="Snacks", image_url="https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80"),
        
        # Drinks
        models.MenuItem(name="Midnight Mocha", description="Dark chocolate cold coffee with whipped cream", price=95.0, category="Drinks", image_url="https://images.unsplash.com/photo-1541167760496-162955ed2a95?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Berry Blast", description="Refreshing mix of blueberries, strawberries and mint", price=85.0, category="Drinks", image_url="https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Classic Lemonade", description="Old fashioned icy lemonade with Himalayan salt", price=45.0, category="Drinks", image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80"),
        
        # Combos
        models.MenuItem(name="Family Feast", description="2 Burgers, 1 Pizza, 2 Drinks and Large Fries", price=599.0, category="Combos", image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"),
        models.MenuItem(name="Value Trio", description="1 Wrap, 1 Snack and 1 Soft Drink", price=199.0, category="Combos", image_url="https://images.unsplash.com/photo-1626700051175-65686c5de224?auto=format&fit=crop&w=400&q=80")
    ]
    db.add_all(items)
    db.commit()
    return {"message": "Menu items seeded successfully"}

@app.post("/reset-menu")
def reset_menu(db: Session = Depends(get_db)):
    db.query(models.OrderItem).delete()
    db.query(models.MenuItem).delete()
    db.commit()
    return seed_data(db)
