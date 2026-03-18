# Arun Bites - QR Ordering System

A modern QR-code-based ordering system for street vendors and small restaurants. Customers can scan a QR code, browse the menu, place orders, and make payments without waiting in crowds.

## Features

- **QR Code Ordering**: Customers scan a QR code to access the ordering interface
- **Real-time Order Updates**: WebSocket-based live updates for order status
- **Smart Priority Queue**: Orders are prioritized based on payment method and items count
- **Payment Methods**: Support for UPI and Cash payments
- **Admin Dashboard**: Vendor interface to manage menu, view orders, and update order status
- **Responsive Design**: Works seamlessly on mobile and desktop devices

## Project Structure

```
vendor-qr-system/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── database.py          # Database configuration & setup
│   ├── priority_queue.py    # Order prioritization logic
│   ├── priority_queue.cpp   # C++ implementation of priority queue
│   ├── requirements.txt      # Python dependencies
│   └── __pycache__/         # Compiled Python files
├── frontend/
│   ├── index.html           # Home page with hero section
│   ├── menu.html            # Menu browsing & cart management
│   ├── cart.html            # Cart and checkout
│   ├── payment.html         # Payment confirmation
│   ├── vendor.html          # Vendor dashboard
│   ├── confirmation.html    # Order confirmation page
│   ├── script.js            # Frontend JavaScript logic
│   └── style.css            # Styling
├── start.bat                # Script to start both backend & frontend
├── .gitignore               # Git ignore configuration
└── README.md                # This file
```

## Tech Stack

**Backend:**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation library
- **Uvicorn** - ASGI server
- **SQLite** - Lightweight database

**Frontend:**
- **HTML5** - Semantic markup
- **CSS3** - Responsive styling with animations
- **JavaScript (Vanilla)** - Client-side logic
- **WebSockets** - Real-time communication with backend
- **http-server** - Simple static file server

## Installation & Setup

### Prerequisites
- Python 3.8+ installed
- Node.js and npm (for http-server)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vendor-qr-system
```

### 2. Set Up Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create database (automatically created on first run)
# Navigate back and follow Quick Start instructions
```

### 3. Set Up Frontend

```bash
# Install http-server globally (one-time setup)
npm install -g http-server
```

## Quick Start

### Option 1: Using the Start Script (Windows)

Simply run the batch file:

```bash
start.bat
```

This will automatically:
- Start the backend server on `http://localhost:8000`
- Start the frontend server on `http://localhost:8080`

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Activate virtual environment
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
http-server -p 8080
```

### Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Vendor Dashboard**: http://localhost:8080/vendor.html

## API Endpoints

### Menu Management
- `GET /menu` - Get all menu items
- `GET /menu/{category}` - Get items by category
- `POST /menu` - Create menu item (Vendor)
- `PUT /menu/{item_id}` - Update menu item (Vendor)
- `DELETE /menu/{item_id}` - Delete menu item (Vendor)

### Orders
- `GET /orders` - Get all orders
- `POST /orders` - Create new order
- `GET /orders/{order_id}` - Get order details
- `PUT /orders/{order_id}/status` - Update order status
- `GET /orders/status/{status}` - Get orders by status

### WebSocket
- `WS /ws` - Real-time order updates connection

## Database Models

### Vendor
```python
- id (Integer, Primary Key)
- name (String)
- upi_id (String)
- logo_url (String, Optional)
```

### MenuItem
```python
- id (Integer, Primary Key)
- name (String)
- description (String)
- price (Float)
- category (String) # Snacks, Drinks, Meals
- image_url (String)
- is_available (Boolean, default: True)
```

### Order
```python
- id (Integer, Primary Key)
- token_number (Integer)
- total_amount (Float)
- payment_method (String) # Cash, UPI
- status (String, default: "Pending") # Pending, Accepted, Preparing, Ready, Delivered, Cancelled
- timestamp (DateTime)
- is_priority (Boolean)
- items (Relationship to OrderItem)
```

### OrderItem
```python
- id (Integer, Primary Key)
- order_id (Integer, Foreign Key)
- menu_item_id (Integer, Foreign Key)
- quantity (Integer)
```

## Environment Configuration

The application uses SQLite by default. To modify database configuration, edit [backend/database.py](backend/database.py):

```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
```

## Development

### Code Structure

- **main.py**: Defines FastAPI app, routes, middleware, and WebSocket manager
- **models.py**: Defines SQLAlchemy ORM models
- **schemas.py**: Defines Pydantic models for request/response validation
- **database.py**: Database connection and session management
- **script.js**: Frontend API calls, state management, and UI logic

### Adding New Features

1. Define model in `backend/models.py`
2. Create schema in `backend/schemas.py`
3. Add endpoint in `backend/main.py`
4. Update frontend to call the new endpoint in `frontend/script.js`
5. Update UI in corresponding HTML files

## Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed
- Check that port 8000 is not in use
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check database file isn't corrupted (delete `sql_app.db` and restart)

### Frontend won't load
- Ensure port 8080 is not in use
- Verify http-server is installed globally: `npm install -g http-server`
- Clear browser cache or try incognito mode

### WebSocket connection fails
- Ensure backend is running on port 8000
- Check browser console for error messages
- Verify CORS is properly configured (it's set to accept all origins in development)

### Database errors
- SQLite database file is auto-created in the `backend/` directory
- If corrupted, delete `sql_app.db` and restart the application

## Performance Considerations

- **Priority Queue**: Uses C++ implementation for faster order prioritization
- **WebSocket**: Broadcasts order updates to all connected clients efficiently
- **SQLite**: Suitable for development; consider PostgreSQL for production

## Future Enhancements

- [ ] Authentication and user accounts
- [ ] Analytics dashboard for vendors
- [ ] SMS/Email notifications
- [ ] Multiple vendor support
- [ ] Mobile app (React Native/Flutter)
- [ ] Payment gateway integration
- [ ] Table reservations
- [ ] Feedback and ratings system

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Made with ❤️ for street vendors everywhere**
