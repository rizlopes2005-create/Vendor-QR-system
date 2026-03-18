# Quick Reference Guide

## Project Quick Info

**Project Name**: Arun Bites - QR Ordering System  
**Type**: Full-Stack Web Application  
**Tech Stack**: FastAPI + SQLAlchemy (Backend), HTML/CSS/JS (Frontend)  
**Status**: Ready for Development  

## File Structure at a Glance

```
📁 Project Root
├── 📄 start.bat                    ← Double-click to run everything
├── 📄 README.md                    ← Full documentation
├── 📄 SETUP.md                     ← Installation & setup guide
├── 📄 DEPLOYMENT.md                ← Production deployment
├── 📄 CONTRIBUTING.md              ← How to contribute
├── 📄 ROADMAP.md                   ← Future features
├── 📄 package.json                 ← npm scripts
├── 📄 LICENSE                      ← MIT License
├── 📄 .env.example                 ← Environment template
├── 📄 .gitignore                   ← Git ignore rules
│
├── 📁 backend/
│   ├── 📄 main.py                  ← API routes & endpoints
│   ├── 📄 models.py                ← Database models
│   ├── 📄 schemas.py               ← Data validation
│   ├── 📄 database.py              ← Database config
│   ├── 📄 priority_queue.py        ← Order prioritization
│   ├── 📄 priority_queue.cpp       ← C++ implementation
│   ├── 📄 requirements.txt          ← Python dependencies
│   └── 🔒 venv/                    ← Virtual environment
│
└── 📁 frontend/
    ├── 📄 index.html               ← Home page
    ├── 📄 menu.html                ← Menu & cart
    ├── 📄 cart.html                ← Checkout
    ├── 📄 payment.html             ← Payment page
    ├── 📄 vendor.html              ← Vendor dashboard
    ├── 📄 confirmation.html        ← Order confirmation
    ├── 📄 script.js                ← Frontend logic
    └── 📄 style.css                ← Styling
```

## Getting Started (5 minutes)

### 1. First Time Setup
```powershell
# Open PowerShell in project directory
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm install -g http-server
```

### 2. Run the Project
```powershell
# Option A: Double-click start.bat (easiest)
start.bat

# Option B: Manual start
# Terminal 1:
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

# Terminal 2:
cd frontend
http-server -p 8080
```

### 3. Access the App
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Vendor Dashboard: http://localhost:8080/vendor.html

## Key Commands

```powershell
# Activate virtual environment
cd backend
.\venv\Scripts\Activate.ps1

# Install new package
pip install <package_name>

# Freeze dependencies
pip freeze > requirements.txt

# Deactivate virtual environment
deactivate

# Run tests (when added)
pytest

# Format code
black backend/

# Lint code
flake8 backend/
```

## API Endpoints Quick Reference

### Menu
```
GET    /menu                        List all menu items
GET    /menu/{category}             Get items by category
POST   /menu                        Add menu item
PUT    /menu/{item_id}              Update menu item
DELETE /menu/{item_id}              Delete menu item
```

### Orders
```
GET    /orders                      List all orders
GET    /orders/{order_id}           Get order details
POST   /orders                      Create order
PUT    /orders/{order_id}/status    Update order status
GET    /orders/status/{status}      Filter by status
```

### WebSocket
```
WS     /ws                          Real-time updates
```

## Database Models Quick Reference

### Order Status Flow
```
Pending → Accepted → Preparing → Ready → Delivered
            ↓
        Cancelled
```

### Key Fields
- **Order**: id, token_number, status, payment_method, is_priority, timestamp
- **OrderItem**: order_id, menu_item_id, quantity
- **MenuItem**: id, name, price, category, is_available
- **Vendor**: id, name, upi_id

## Common Tasks

### Add New Menu Item
1. Backend: Add route in `main.py`
2. Database: Uses MenuItem model in `models.py`
3. Frontend: Call API in `script.js`

### Update Order Status
1. Vendor clicks button in `vendor.html`
2. Calls `PUT /orders/{id}/status` endpoint
3. WebSocket broadcasts update to all clients
4. Frontend updates display in real-time

### Debug Issues
1. Check browser console: **F12**
2. Check backend terminal: Look for error messages
3. Check browser network tab: See API requests/responses
4. Delete `backend/sql_app.db` to reset database

## Environment Variables

Default `.env` loaded automatically. For custom config, create `.env` file:
```bash
DATABASE_URL=sqlite:///./sql_app.db
DEBUG=True
ALLOWED_ORIGINS=http://localhost:8080
```

See `.env.example` for all available options.

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Port 8000 in use | Change port: `uvicorn main:app --port 8001` |
| Port 8080 in use | Change port: `http-server -p 8081` |
| venv not found | Run: `python -m venv venv` in backend directory |
| http-server not found | Install: `npm install -g http-server` |
| Database error | Delete `sql_app.db` and restart |
| WebSocket fails | Ensure backend running on port 8000 |
| CORS error | Check `ALLOWED_ORIGINS` in `.env` |

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: description"

# Push and create PR
git push origin feature/your-feature
```

## Important Files to Know

| File | Purpose |
|------|---------|
| `main.py` | All API endpoints and WebSocket logic |
| `models.py` | Database table definitions |
| `schemas.py` | Request/response validation |
| `script.js` | All frontend functionality |
| `style.css` | All styling |
| `start.bat` | Automated start script |

## Documentation Files

| Doc | Contains |
|-----|----------|
| README.md | Full project overview |
| SETUP.md | Installation & troubleshooting |
| DEPLOYMENT.md | Production deployment guide |
| CONTRIBUTING.md | How to contribute |
| ROADMAP.md | Future features & roadmap |
| QUICK_REFERENCE.md | This file! |

## Useful Links

- 📚 [FastAPI Documentation](https://fastapi.tiangolo.com/)
- 🐍 [Python Documentation](https://docs.python.org/)
- 🎨 [MDN Web Docs](https://developer.mozilla.org/)
- 📦 [HTTP Server GitHub](https://github.com/http-party/http-server)
- 🗾 [SQLAlchemy Docs](https://docs.sqlalchemy.org/)

## Code Examples

### Add New Endpoint in main.py
```python
@app.get("/items/{item_id}")
async def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

### Fetch Data in script.js
```javascript
async function fetchMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching menu:', error);
    }
}
```

### WebSocket Connection
```javascript
const ws = new WebSocket(WS_URL);
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};
```

---

## Need Help?

1. Check the relevant `.md` file (README.md, SETUP.md, etc.)
2. Search [Issues](https://github.com/yourusername/vendor-qr-system/issues)
3. Read [CONTRIBUTING.md](CONTRIBUTING.md)
4. Check FastAPI docs: http://localhost:8000/docs

---

**Happy coding! 🚀**
