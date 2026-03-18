# Setup Instructions

## Windows Setup Guide

### Prerequisites Installation

1. **Install Python 3.8+**
   - Download from https://www.python.org/
   - During installation, check "Add Python to PATH"
   - Verify: Open PowerShell and run `python --version`

2. **Install Node.js & npm**
   - Download from https://nodejs.org/
   - Verify: Open PowerShell and run `node --version` and `npm --version`

### Initial Setup (One-time)

1. **Open PowerShell as Administrator** and navigate to the project directory:
   ```powershell
   cd "C:\Users\rizlo\OneDrive\Desktop\Vendor QR system"
   ```

2. **Create Python Virtual Environment**:
   ```powershell
   cd backend
   python -m venv venv
   ```

3. **Activate Virtual Environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   > Note: If you get an execution policy error, run:
   > ```powershell
   > Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   > ```

4. **Install Python Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

5. **Install Frontend Dependencies** (back in PowerShell, any directory):
   ```powershell
   npm install -g http-server
   ```

6. **Verify Installation**:
   ```powershell
   # Should show installed packages
   pip list
   
   # Should show http-server path
   where http-server
   ```

## Running the Project

### Quick Start (Easiest)

Simply double-click `start.bat` in the project root. This automatically:
- Opens backend server on http://localhost:8000
- Opens frontend on http://localhost:8080

### Manual Start

**Terminal 1 (Backend):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
http-server -p 8080
```

### Access Points

- 🌐 **Frontend**: http://localhost:8080
- 📡 **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/docs
- 🏪 **Vendor Dashboard**: http://localhost:8080/vendor.html

## First-Time Use

1. Open http://localhost:8080 in your browser
2. Click "Start Ordering"
3. Browse the menu (data from backend)
4. Add items to cart
5. Proceed to checkout and select payment method
6. Complete order

To view orders as vendor:
- Go to http://localhost:8080/vendor.html
- View all orders in real-time
- Update order status (Pending → Accepted → Preparing → Ready → Delivered)

## Troubleshooting

### "venv is not recognized"
- Make sure you're in the `backend/` directory
- Try using the full path: `.\venv\Scripts\Activate.ps1`
- Ensure PowerShell execution policy is set correctly

### "http-server is not recognized"
- Reinstall globally: `npm install -g http-server`
- Or use absolute path if installed in specific location
- Verify with `where http-server`

### Port 8000 or 8080 already in use
- Find what's using the port:
  ```powershell
  netstat -ano | findstr :8000
  netstat -ano | findstr :8080
  ```
- Stop the process or use different ports:
  ```powershell
  uvicorn main:app --port 8001
  http-server -p 8081
  ```

### Database errors
- Delete `backend/sql_app.db` and restart
- Database will be auto-created

### CORS or WebSocket errors
- Ensure backend is running
- Check console in browser Developer Tools (F12)
- Verify localhost URLs match config

## Next Steps

- Read the main [README.md](README.md) for feature overview
- Check [backend/main.py](backend/main.py) for API route details
- Review [frontend/script.js](frontend/script.js) for client-side logic
- Explore database schema in [backend/models.py](backend/models.py)

## Development Workflow

1. Make code changes
2. Backend auto-reloads (uvicorn --reload)
3. Frontend can be refreshed in browser (F5)
4. Check browser console (F12) for frontend errors
5. Check terminal for backend errors

## Deactivating Virtual Environment

When done, deactivate the virtual environment:
```powershell
deactivate
```

---

**Ready to start? Run `start.bat`!** 🚀
