const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// UPDATE THIS with your real Render backend URL after you deploy it:
const PROD_BACKEND_URL = 'https://your-backend-name.onrender.com'; 

const API_URL = IS_LOCAL ? 'http://localhost:8000' : PROD_BACKEND_URL;
const WS_URL = IS_LOCAL ? 'ws://localhost:8000/ws' : PROD_BACKEND_URL.replace('http', 'ws') + '/ws';

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'All';
let selectedPayment = 'Cash';

// --- SHARED UTILS ---

function updateLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function showToast(message) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: #333; color: white; padding: 10px 20px; border-radius: 20px;
        z-index: 9999; font-size: 0.9rem; animation: fadeIn 0.3s;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// --- MENU PAGE LOGIC ---

async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        if (!response.ok) throw new Error('Failed to fetch menu');
        const items = await response.json();
        window.menuItems = items;
        renderMenu(items);
        renderCategories(items);
    } catch (err) {
        console.error(err);
        document.getElementById('menu-container').innerHTML = '<p style="text-align:center; padding:20px;">Could not load menu. Make sure the backend is running.</p>';
    }
}

function renderMenu(items) {
    const container = document.getElementById('menu-container');
    if (!container) return;
    
    container.innerHTML = '';
    const filtered = currentCategory === 'All' 
        ? items 
        : items.filter(i => i.category === currentCategory);

    filtered.forEach(item => {
        const finalImageUrl = (item.image_url.startsWith('http') || item.image_url.startsWith('data:')) 
            ? item.image_url 
            : `images/${item.image_url}`;

        const card = document.createElement('div');
        card.className = 'food-card animate-fade-in';
        card.innerHTML = `
            <div class="food-img-container">
                <img src="${finalImageUrl}" class="food-img" alt="${item.name}">
            </div>
            <div class="food-details">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
            </div>
            <div class="food-card-footer">
                <span class="food-price">₹${item.price}</span>
                <div class="add-btn" onclick="addToCart(${item.id}, event)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderCategories(items) {
    const container = document.getElementById('category-tabs');
    if (!container) return;

    // Get unique categories
    const categories = ['All', ...new Set(items.map(i => i.category))];
    
    // Icon mapping
    const icons = {
        'All': '🍽️',
        'Burgers': '🍔',
        'Pizza': '🍕',
        'Rolls': '🌯',
        'Snacks': '🍿',
        'Drinks': '🥤',
        'Combos': '🍱',
        'Meals': '🍱'
    };

    container.innerHTML = categories.map(cat => `
        <div class="category-pill ${cat === currentCategory ? 'active' : ''}" onclick="filterMenu('${cat}')">
            <span>${icons[cat] || '🥘'}</span> ${cat}
        </div>
    `).join('');
}

function filterMenu(category) {
    currentCategory = category;
    document.querySelectorAll('.category-pill').forEach(t => {
        const pillText = t.innerText.trim().split(' ').pop();
        const isActive = pillText === category;
        t.classList.toggle('active', isActive);
        if (isActive) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    renderMenu(window.menuItems);
}

function searchMenu(query) {
    const q = query.toLowerCase();
    const filtered = window.menuItems.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
    );
    renderMenu(filtered);
}

function addToCart(itemId, event) {
    const item = window.menuItems.find(i => i.id === itemId);
    const existing = cart.find(c => c.id === itemId);
    
    // Animation: Fly to cart
    if (event) {
        const btn = event.currentTarget || event.target;
        const img = btn.closest('.food-card').querySelector('.food-img');
        if (img) animateFlyToCart(img);
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateLocalStorage();
    updateCartUI();
    showToast(`Added ${item.name} to cart`);
    
    // Smart Suggestion
    if (item.category === 'Meals' || item.name.includes('Burger')) {
        showSuggestions(item);
    }
}

function animateFlyToCart(img) {
    const cartBubble = document.getElementById('cart-float');
    if (!cartBubble) return;

    const clone = img.cloneNode();
    const rect = img.getBoundingClientRect();
    const cartRect = cartBubble.getBoundingClientRect();

    clone.classList.add('flying-img');
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;

    document.body.appendChild(clone);

    setTimeout(() => {
        clone.style.top = `${cartRect.top + 10}px`;
        clone.style.left = `${cartRect.left + 10}px`;
        clone.style.width = '20px';
        clone.style.height = '20px';
        clone.style.opacity = '0';
    }, 10);

    setTimeout(() => {
        clone.remove();
        cartBubble.classList.add('bounce');
        setTimeout(() => cartBubble.classList.remove('bounce'), 500);
    }, 800);
}

function showSuggestions(addedItem) {
    const overlay = document.getElementById('suggestion-overlay');
    if (!overlay) return;
    
    const container = document.getElementById('suggestion-list');
    container.innerHTML = '';
    
    // Simple logic: If meal, suggest drink. If drink, suggest snack.
    const suggestions = window.menuItems.filter(i => 
        (addedItem.category === 'Meals' && i.category === 'Drinks') ||
        (addedItem.category === 'Drinks' && i.category === 'Snacks')
    ).slice(0, 2);

    if (suggestions.length === 0) return;

    suggestions.forEach(s => {
        const finalImageUrl = (s.image_url.startsWith('http') || s.image_url.startsWith('data:')) 
            ? s.image_url 
            : `images/${s.image_url}`;

        const div = document.createElement('div');
        div.style.cssText = 'display:flex; align-items:center; gap:15px; margin-bottom:15px; background:#F8FAFC; padding:10px; border-radius:15px; text-align:left;';
        div.innerHTML = `
            <img src="${finalImageUrl}" style="width:50px; height:50px; border-radius:10px; object-fit:cover;">
            <div style="flex:1;">
                <h4 style="font-size:0.9rem;">${s.name}</h4>
                <p style="font-size:0.8rem; color:var(--primary); font-weight:700;">₹${s.price}</p>
            </div>
            <button onclick="addToCart(${s.id}); closeSuggestions();" class="add-btn" style="width:30px; height:30px;">+</button>
        `;
        container.appendChild(div);
    });

    overlay.style.display = 'flex';
}

function closeSuggestions() {
    const overlay = document.getElementById('suggestion-overlay');
    if (overlay) overlay.style.display = 'none';
}

function updateCartUI() {
    const floatBar = document.getElementById('cart-float');
    if (!floatBar) return;

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (totalQty > 0) {
        floatBar.style.display = 'flex';
        floatBar.innerHTML = `
            <div id="float-qty-bubble">${totalQty}</div>
            <span style="font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">🛒</span>
            <span style="font-weight: 800; font-size: 0.8rem; margin-top: 2px;">₹${totalPrice}</span>
        `;
    } else {
        floatBar.style.display = 'none';
    }
}

function goToCart() {
    window.location.href = 'cart.html';
}

// --- CART PAGE LOGIC ---

function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const emptyMsg = document.getElementById('empty-cart');
    const summary = document.getElementById('cart-summary');
    
    if (!container) return;

    if (cart.length === 0) {
        container.style.display = 'none';
        summary.style.display = 'none';
        emptyMsg.style.display = 'block';
        return;
    }

    container.innerHTML = '';
    emptyMsg.style.display = 'none';
    summary.style.display = 'block';

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'card animate-fade-in';
        div.style.padding = '12px';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="font-weight: 700;">${item.name}</h4>
                    <p style="color: var(--primary); font-weight: 800; font-size: 0.9rem;">₹${item.price}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 15px; background: #F0F0F0; padding: 5px 12px; border-radius: 10px;">
                    <button onclick="changeQty(${item.id}, -1)" style="border:none; background:none; font-weight:800; padding:5px; cursor:pointer;">-</button>
                    <span style="font-weight: 800;">${item.quantity}</span>
                    <button onclick="changeQty(${item.id}, 1)" style="border:none; background:none; font-weight:800; padding:5px; cursor:pointer;">+</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById('subtotal').innerText = `₹${total}`;
    document.getElementById('total').innerText = `₹${total}`;
    document.querySelectorAll('.pay-amount').forEach(el => el.innerText = total);
}

function changeQty(id, delta) {
    const index = cart.findIndex(i => i.id === id);
    if (index === -1) return;

    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    updateLocalStorage();
    renderCartPage();
}

function selectPayment(method) {
    selectedPayment = method;
    document.getElementById('method-cash').classList.toggle('active', method === 'Cash');
    document.getElementById('method-upi').classList.toggle('active', method === 'UPI');
}

async function placeOrder() {
    if (cart.length === 0) return;

    // If UPI is selected and we are NOT on the payment page yet, redirect there
    if (selectedPayment === 'UPI' && !window.location.href.includes('payment.html')) {
        const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        window.location.href = `payment.html?amount=${total}`;
        return;
    }

    const btn = document.getElementById('place-order-btn') || document.getElementById('confirm-payment-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Placing Order...';
    }

    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    // If we are on payment page, payment_method must be UPI
    const method = window.location.href.includes('payment.html') ? 'UPI' : selectedPayment;
    
    const payload = {
        total_amount: total,
        payment_method: method,
        items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
    };

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to place order');
        const order = await response.json();
        
        // Clear cart
        cart = [];
        updateLocalStorage();
        
        window.location.href = `confirmation.html?id=${order.id}`;
    } catch (err) {
        console.error(err);
        alert('Could not place order. Please try again.');
        if (btn) {
            btn.disabled = false;
            btn.innerText = window.location.href.includes('payment.html') ? 'I Have Paid - Place Order' : 'Confirm & Place Order';
        }
    }
}

// --- CONFIRMATION PAGE LOGIC ---

async function trackOrder(orderId) {
    const updateProgress = (status) => {
        const steps = ['Pending', 'Preparing', 'Ready'];
        const line = document.querySelector('.tracker-line-progress');
        const currentIdx = steps.indexOf(status);
        
        if (line) line.style.width = `${(currentIdx / (steps.length - 1)) * 100}%`;
        
        document.querySelectorAll('.tracker-step').forEach((step, idx) => {
            step.classList.toggle('active', idx === currentIdx);
            step.classList.toggle('completed', idx < currentIdx);
        });
    };

    const updateUI = (order) => {
        document.getElementById('order-token').innerText = order.token_number;
        const statusEl = document.getElementById('order-status');
        statusEl.innerText = order.status;
        statusEl.className = `badge badge-${order.status.toLowerCase()}`;
        updateProgress(order.status);
    };

    // Initial load
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const order = await res.json();
        updateUI(order);
    } catch(e) {}

    // Listen for real-time status updates via WebSocket
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS_UPDATE' && data.order_id == orderId) {
            const statusEl = document.getElementById('order-status');
            statusEl.innerText = data.status;
            statusEl.className = `badge badge-${data.status.toLowerCase()}`;
            updateProgress(data.status);
            if (data.status === 'Ready') {
                showToast("Your food is ready for pickup!");
            }
        }
    };
}

// --- VENDOR DASHBOARD LOGIC ---

let vendorOrders = [];

async function initVendorDashboard() {
    loadVendorOrders();

    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ORDER') {
            vendorOrders.unshift(data.order);
            document.getElementById('order-sound').play().catch(() => {});
            renderVendorOrders();
        } else if (data.type === 'STATUS_UPDATE') {
            const order = vendorOrders.find(o => o.id === data.order_id);
            if (order) {
                order.status = data.status;
                renderVendorOrders();
            }
        }
    };
}

async function loadVendorOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        vendorOrders = await response.json();
        renderVendorOrders();
    } catch(e) {
        console.error("Dashboard failed to load orders", e);
    }
}

function renderVendorOrders() {
    const container = document.getElementById('vendor-order-list');
    if (!container) return;

    if (vendorOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">No orders yet today.</div>';
        return;
    }

    container.innerHTML = '';
    
    // Stats
    document.getElementById('stats-orders').innerText = vendorOrders.length;
    const todaySales = vendorOrders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.total_amount : sum, 0);
    document.getElementById('stats-sales').innerText = `₹${todaySales}`;
    
    // Filter active orders (remove Ready, Delivered and Cancelled from main vendor view)
    const activeOrders = vendorOrders.filter(o => o.status !== 'Ready' && o.status !== 'Delivered' && o.status !== 'Cancelled');
    document.getElementById('order-count-badge').innerText = activeOrders.length;

    if (activeOrders.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
                <div style="font-size: 4rem; opacity: 0.2; margin-bottom: 20px;">🍱</div>
                <h3 style="color: var(--text-main); font-weight: 800;">No Active Orders</h3>
                <p style="color: var(--text-muted);">New orders will appear here automatically.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    activeOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card animate-fade-in ${order.is_priority ? 'priority' : ''}`;
        card.id = `order-${order.id}`;
        card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        
        const itemsHtml = order.items.map(i => `
            <div class="order-item-row">
                <span>${i.quantity}x ${i.menu_item.name}</span>
                <span style="color:var(--text-muted);">₹${i.menu_item.price * i.quantity}</span>
            </div>
        `).join('');

        const time = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="order-header">
                <div>
                    <span class="order-id">Token #${order.token_number}</span>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Placed at ${time}</p>
                </div>
                <span class="badge badge-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            
            <div class="order-items-list">
                ${itemsHtml}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">${order.payment_method}</span>
                <span style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">Total: ₹${order.total_amount}</span>
            </div>

            ${order.is_priority ? `
                <div style="background: #FFF5F5; padding: 10px; border-radius: 12px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; color: #D63031; border: 1px solid #FED7D7;">
                    <span style="font-size: 1.2rem;">★</span>
                    <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Priority: Small Order</span>
                </div>
            ` : ''}

            <div style="display: flex; gap: 10px;">
                ${order.status === 'Pending' ? `
                    <button type="button" class="btn btn-primary" style="flex:1;" onclick="updateStatus(${order.id}, 'Preparing')">Accept & Cook</button>
                ` : ''}
                
                ${order.status === 'Preparing' ? `
                    <button type="button" class="btn btn-warning" style="flex:1; background:#F1C40F; color:#1E293B;" onclick="updateStatus(${order.id}, 'Ready')">Mark Ready</button>
                ` : ''}
                
                ${order.status === 'Ready' ? `
                    <button type="button" class="btn btn-success" style="flex:1; background:#10B981; color:white;" onclick="updateStatus(${order.id}, 'Delivered')">Done (Hand Over)</button>
                ` : ''}

                <button type="button" class="btn btn-outline" style="width: 50px; padding: 0;" title="Cancel Order" onclick="updateStatus(${order.id}, 'Cancelled')">×</button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function updateStatus(orderId, status) {
    const card = document.getElementById(`order-${orderId}`);
    
    // Optimistically update local state for immediate feedback
    const order = vendorOrders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        
        // If it's a "terminal" status for the vendor view, animate removal
        if (status === 'Ready' || status === 'Delivered' || status === 'Cancelled') {
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9) translateY(20px)';
                card.style.pointerEvents = 'none';
                
                setTimeout(() => {
                    renderVendorOrders();
                }, 400); // Match CSS transition
            } else {
                renderVendorOrders();
            }
        } else {
            renderVendorOrders();
        }
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status?status=${status}`, { method: 'PATCH' });
        if (!response.ok) throw new Error("Update failed");
    } catch(e) {
        console.error("Status update failed", e);
        // On error, reload to sync state
        loadVendorOrders();
    }
}
