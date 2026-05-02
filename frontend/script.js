// Detect if running locally or on deployed site
const hostname = window.location.hostname;
const IS_LOCAL = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');

// 🔴 YOUR RENDER BACKEND URL
const PROD_BACKEND_URL = 'https://vendor-qr-system-1.onrender.com';

// API endpoint (REST)
const API_URL = IS_LOCAL
    ? `http://${hostname}:8000`
    : PROD_BACKEND_URL;

// WebSocket endpoint (Real-time updates)
const WS_URL = IS_LOCAL
    ? `ws://${hostname}:8000/ws`
    : PROD_BACKEND_URL.replace('https', 'wss').replace('http', 'ws') + '/ws';

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'All';
let selectedPayment = 'Cash';

// --- SHARED UTILS ---

function updateLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
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

        // Fetch wait time
        const waitRes = await fetch(`${API_URL}/wait-time`);
        const waitData = await waitRes.json();
        const waitEl = document.getElementById('menu-wait-time');
        if (waitEl) waitEl.querySelector('span:last-child').innerText = `Wait: ~${waitData.estimated_wait_minutes} mins`;
        
        updateLoyaltyUI();
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
        card.className = `food-card animate-fade-in ${!item.is_available ? 'sold-out' : ''}`;
        card.innerHTML = `
            <div class="food-img-container">
                <img src="${finalImageUrl}" class="food-img" alt="${item.name}">
                ${!item.is_available ? '<div class="sold-out-badge">Sold Out</div>' : ''}
            </div>
            <div class="food-details">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
            </div>
            <div class="food-card-footer">
                <span class="food-price">₹${item.price}</span>
                ${item.is_available ? `
                    <div class="add-btn" onclick="addToCart(${item.id}, event)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                ` : `
                    <div class="add-btn disabled" title="Currently unavailable">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                `}
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
        div.className = 'suggestion-item';
        div.innerHTML = `
            <img src="${finalImageUrl}" class="suggestion-img">
            <div style="flex:1;">
                <h4 style="font-size:0.9rem;">${s.name}</h4>
                <p style="font-size:0.8rem; color:var(--primary); font-weight:700;">₹${s.price}</p>
            </div>
            <button onclick="addToCart(${s.id}); closeSuggestions();" class="add-btn" style="width:32px; height:32px;">+</button>
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
        div.className = 'cart-item animate-fade-in';
        div.innerHTML = `
            <div>
                <h4 style="font-weight: 700;">${item.name}</h4>
                <p style="color: var(--primary); font-weight: 800; font-size: 0.9rem;">₹${item.price}</p>
            </div>
            <div class="qty-control">
                <button onclick="changeQty(${item.id}, -1)" class="qty-btn">-</button>
                <span style="font-weight: 800;">${item.quantity}</span>
                <button onclick="changeQty(${item.id}, 1)" class="qty-btn">+</button>
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
        items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity })),
        is_loyalty_boosted: parseInt(localStorage.getItem('loyalty_stamps') || '0') >= 5
    };

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to place order');
        
        if (response.ok) {
            const order = await response.json();
            
            // Loyalty Logic: Increment stamp count
            let stamps = parseInt(localStorage.getItem('loyalty_stamps') || '0');
            stamps = (stamps + 1) % 6; // Reset after 5 stamps
            localStorage.setItem('loyalty_stamps', stamps);
            
            // Clear cart
            cart = [];
            updateLocalStorage();

            window.location.href = `confirmation.html?id=${order.id}`;
        }
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
        
        // Reveal feedback section if order is completed
        if (order.status === 'Ready' || order.status === 'Delivered') {
            const feedbackSec = document.getElementById('feedback-section');
            if (feedbackSec) feedbackSec.style.display = 'block';
        }
    };

    // Initial load
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const order = await res.json();
        updateUI(order);

        // Fetch wait time
        const waitRes = await fetch(`${API_URL}/wait-time`);
        const waitData = await waitRes.json();
        const waitEl = document.getElementById('wait-time');
        if (waitEl) waitEl.innerText = `~${waitData.estimated_wait_minutes} mins`;
    } catch (e) { }

    // Listen for real-time status updates via WebSocket
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS_UPDATE' && data.order_id == orderId) {
            const statusEl = document.getElementById('order-status');
            statusEl.innerText = data.status;
            statusEl.className = `badge badge-${data.status.toLowerCase()}`;
            updateProgress(data.status);
            if (data.status === 'Ready' || data.status === 'Delivered') {
                showToast("Your food is ready for pickup!");
                const feedbackSec = document.getElementById('feedback-section');
                if (feedbackSec) feedbackSec.style.display = 'block';
            }
        }
    };
}

// --- VENDOR DASHBOARD LOGIC ---

let vendorOrders = [];

async function initVendorDashboard() {
    loadVendorOrders();
    loadMenuForManagement();
    loadTopItems();
    generateVendorQR();
    
    // Refresh QR code every 30 seconds with a visual countdown
    let timeLeft = 30;
    const updateCountdown = () => {
        const timerEl = document.querySelector('#qr-refresh-timer span:last-child');
        if (timerEl) timerEl.innerText = `Refreshing in ${timeLeft}s`;
        
        const progressEl = document.getElementById('qr-progress-bar');
        if (progressEl) progressEl.style.width = `${(timeLeft / 30) * 100}%`;
        
        if (timeLeft <= 0) {
            generateVendorQR();
            timeLeft = 30;
        }
        timeLeft--;
    };
    setInterval(updateCountdown, 1000);

    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ORDER') {
            vendorOrders.unshift(data.order);
            document.getElementById('order-sound').play().catch(() => { });
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
    } catch (e) {
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

    // Update Stats
    const todaySales = vendorOrders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.total_amount : sum, 0);
    document.getElementById('stats-orders').innerText = vendorOrders.length;
    document.getElementById('stats-sales').innerText = `₹${todaySales}`;

    // Filter active orders
    const activeOrders = vendorOrders.filter(o => o.status !== 'Ready' && o.status !== 'Delivered' && o.status !== 'Cancelled');
    document.getElementById('order-count-badge').innerText = activeOrders.length;

    // Update Batch Summary Bar
    updateBatchSummary(activeOrders);

    if (activeOrders.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
                <div style="font-size: 4rem; opacity: 0.2; margin-bottom: 20px;">🍱</div>
                <h3 style="color: white; font-weight: 800;">Kitchen is Clear</h3>
                <p style="color: var(--text-muted);">New orders will appear here automatically.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    activeOrders.forEach(order => {
        const orderAgeMins = (new Date() - new Date(order.timestamp)) / 60000;
        const isHeatAlert = orderAgeMins > 10; // Old order alert after 10 mins

        const card = document.createElement('div');
        card.className = `order-card animate-fade-in ${isHeatAlert ? 'heat-alert' : ''}`;
        card.id = `order-${order.id}`;

        const itemsHtml = order.items.map(i => `
            <div class="order-item-row" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0;">
                <span style="font-weight:700;">${i.quantity}x ${i.menu_item.name}</span>
                <span style="color:#94A3B8;">₹${i.menu_item.price * i.quantity}</span>
            </div>
        `).join('');

        const time = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let actionButton = '';
        if (order.status === 'Pending') {
            actionButton = `<button class="action-btn-main btn-start" onclick="updateStatus(${order.id}, 'Preparing')">🔥 Start Cooking</button>`;
        } else if (order.status === 'Preparing') {
            actionButton = `<button class="action-btn-main btn-ready" onclick="updateStatus(${order.id}, 'Ready')">✅ Ready for Pickup</button>`;
        }

        card.innerHTML = `
            <div class="order-header" style="margin-bottom: 15px;">
                <div>
                    <span class="order-id" style="font-size: 1.4rem;">Token #${order.token_number}</span>
                    <p style="font-size: 0.8rem; color: #94A3B8; margin-top: 4px;">Placed ${Math.floor(orderAgeMins)}m ago (${time})</p>
                </div>
                <span class="badge badge-${order.status.toLowerCase()}" style="font-size: 0.7rem;">${order.status}</span>
            </div>
            
            <div class="order-items-list" style="margin-bottom: 15px;">
                ${itemsHtml}
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
                ${order.payment_method === 'UPI' ? '<span style="background:rgba(59, 130, 246, 0.1); color:#60A5FA; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:800; border:1px solid rgba(59, 130, 246, 0.2);">💳 UPI PAID</span>' : ''}
                ${order.items.reduce((s, i) => s + i.quantity, 0) <= 2 ? '<span style="background:rgba(16, 185, 129, 0.1); color:#34D399; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:800; border:1px solid rgba(16, 185, 129, 0.2);">⚡ FAST TRACK</span>' : ''}
                ${order.is_loyalty_boosted ? '<span style="background:rgba(139, 92, 246, 0.1); color:#A78BFA; padding:4px 10px; border-radius:6px; font-size:0.7rem; font-weight:800; border:1px solid rgba(139, 92, 246, 0.2);">👑 LOYALTY</span>' : ''}
            </div>

            ${actionButton}
            
            <button class="btn-outline" style="width: 100%; margin-top: 10px; border-color: #334155; color: #94A3B8; font-size: 0.75rem; border-radius: 8px; padding: 5px;" onclick="updateStatus(${order.id}, 'Cancelled')">Cancel Order</button>
        `;
        container.appendChild(card);
    });
}

function updateBatchSummary(orders) {
    const bar = document.getElementById('batch-prep-bar');
    if (!bar) return;

    if (orders.length === 0) {
        bar.style.display = 'none';
        return;
    }

    const itemCounts = {};
    orders.forEach(o => {
        o.items.forEach(i => {
            const name = i.menu_item.name;
            itemCounts[name] = (itemCounts[name] || 0) + i.quantity;
        });
    });

    const pills = Object.entries(itemCounts).map(([name, count]) => `
        <div class="batch-pill">
            <span style="opacity: 0.7;">${count}x</span> ${name}
        </div>
    `).join('');

    bar.innerHTML = `<span style="font-size: 0.8rem; font-weight: 800; color: #94A3B8; margin-right: 10px;">PREP TOTALS:</span> ${pills}`;
    bar.style.display = 'flex';
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
    } catch (e) {
        console.error("Status update failed", e);
        // On error, reload to sync state
        loadVendorOrders();
    }
}

async function loadMenuForManagement() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const items = await response.json();
        renderMenuManagement(items);
    } catch (e) {
        console.error("Failed to load menu for management", e);
    }
}

function renderMenuManagement(items) {
    const container = document.getElementById('vendor-menu-management');
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div class="menu-manage-item ${item.is_available ? '' : 'sold-out'}" onclick="toggleItemAvailability(${item.id}, ${item.is_available})">
            <img src="${item.image_url.startsWith('http') ? item.image_url : 'images/' + item.image_url}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
            <div style="font-size: 0.75rem; font-weight: 700; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 60px; text-align: center;">${item.name}</div>
            <div style="font-size: 0.65rem; color: ${item.is_available ? 'var(--success)' : 'var(--primary)'}; font-weight: 800;">
                ${item.is_available ? 'Available' : 'Sold Out'}
            </div>
        </div>
    `).join('');
}

async function toggleItemAvailability(itemId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const response = await fetch(`${API_URL}/menu/${itemId}/availability?is_available=${newStatus}`, { method: 'PATCH' });
        if (response.ok) {
            loadMenuForManagement();
            // Optional: Show toast
            showToast(`Item marked as ${newStatus ? 'Available' : 'Sold Out'}`);
        }
    } catch (e) {
        console.error("Toggle failed", e);
    }
}

async function loadTopItems() {
    try {
        const response = await fetch(`${API_URL}/analytics/top-items`);
        const data = await response.json();
        renderTopItems(data);
    } catch (e) { }
}

function renderTopItems(data) {
    const container = document.getElementById('top-items-list');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<span style="font-size: 0.8rem; opacity: 0.7;">No data yet.</span>';
        return;
    }

    container.innerHTML = data.map((item, idx) => `
        <div style="background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); min-width: 100px;">
            <div style="font-size: 1.1rem; margin-bottom: 2px;">${idx === 0 ? '👑' : '🔥'}</div>
            <div style="font-size: 0.85rem; font-weight: 700; white-space: nowrap;">${item.name}</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">${item.count} orders</div>
        </div>
    `).join('');
}

function updateLoyaltyUI() {
    const section = document.getElementById('loyalty-section');
    const container = document.getElementById('stamps-container');
    const label = document.getElementById('stamps-needed');
    if (!section || !container) return;

    const stamps = parseInt(localStorage.getItem('loyalty_stamps') || '0');
    section.style.display = 'block';

    let html = '';
    for (let i = 1; i <= 5; i++) {
        const isEarned = i <= stamps;
        html += `
            <div style="width: 35px; height: 35px; background: ${isEarned ? 'var(--primary)' : 'white'}; border: 2px solid ${isEarned ? 'var(--primary)' : '#E2E8F0'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: ${isEarned ? 'white' : '#CBD5E1'};">
                ${isEarned ? '🥘' : '◯'}
            </div>
        `;
    }
    container.innerHTML = html;
    
    if (stamps >= 5) {
        label.innerText = "FREE ITEM UNLOCKED! 🎉";
        label.style.color = "var(--success)";
    } else {
        label.innerText = `${5 - stamps} orders to go!`;
        label.style.color = "var(--primary)";
    }
}

function openQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.style.display = 'flex';
        generateVendorQR();
    }
}

function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) modal.style.display = 'none';
}

function generateVendorQR() {
    const container = document.getElementById("qrcode");
    if (!container) return;

    container.innerHTML = "";
    
    // Get current origin for local/prod testing support
    const currentOrigin = window.location.origin;
    // Add a unique timestamp to make the URL/QR dynamic
    const timestamp = Math.floor(Date.now() / 1000);
    const menuUrl = `${currentOrigin}/menu.html?v=${timestamp}`;
    
    console.log("Generating dynamic QR for:", menuUrl);

    new QRCode(container, {
        text: menuUrl,
        width: 256,
        height: 256,
        colorDark: "#1E293B",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Optional: Update the visible URL text if it exists in a modal
    const urlText = document.querySelector('.qr-modal .url-display');
    if (urlText) urlText.innerText = menuUrl;
}

function downloadQRCode() {
    const container = document.getElementById("qrcode");
    const img = container.querySelector("img");
    const canvas = container.querySelector("canvas");

    const dataUrl = img ? img.src : (canvas ? canvas.toDataURL("image/png") : null);

    if (dataUrl) {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "ArunBites_Vendor_QR.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function printQRCode() {
    const container = document.getElementById("qrcode");
    const img = container.querySelector("img");
    const canvas = container.querySelector("canvas");
    const qrSrc = img ? img.src : (canvas ? canvas.toDataURL("image/png") : "");

    if (!qrSrc) return;

    const currentOrigin = window.location.origin;
    const menuUrl = `${currentOrigin}/menu.html`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Menu QR - Arun Bites</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                    body { 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        height: 100vh; 
                        font-family: 'Outfit', sans-serif; 
                        text-align: center; 
                        background: #F8FAFC;
                        color: #1E293B;
                    }
                    .qr-card {
                        background: white;
                        padding: 40px;
                        border-radius: 40px;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                        border: 2px solid #E2E8F0;
                    }
                    img { 
                        width: 400px; 
                        height: 400px; 
                        margin-bottom: 30px; 
                        padding: 20px;
                        background: white;
                        border-radius: 20px;
                    }
                    h1 { 
                        margin: 0; 
                        font-size: 32px; 
                        font-weight: 800;
                        color: #FF4D00; 
                    }
                    p { 
                        font-size: 18px; 
                        color: #64748B; 
                        margin-top: 10px; 
                        font-weight: 600;
                    }
                    .url {
                        margin-top: 20px;
                        font-size: 14px;
                        color: #94A3B8;
                        text-transform: lowercase;
                    }
                </style>
            </head>
            <body>
                <div class="qr-card">
                    <h1>Scan to View Menu</h1>
                    <p>Place your order directly from your phone!</p>
                    <img src="${qrSrc}" />
                    <div class="url">${menuUrl}</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() { window.close(); };
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// --- FEEDBACK LOGIC ---
let selectedRating = 0;

function setRating(stars) {
    selectedRating = stars;
    const starElements = document.querySelectorAll('.star');
    starElements.forEach((s, idx) => {
        s.innerText = idx < stars ? '⭐' : '☆';
        s.style.color = idx < stars ? '#FFD700' : '#CBD5E1';
    });
    
    const submitBtn = document.getElementById('submit-feedback');
    if (submitBtn) submitBtn.style.display = 'inline-block';
}

async function submitFeedback() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId || selectedRating === 0) return;

    try {
        const response = await fetch(`${API_URL}/ratings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: parseInt(orderId),
                stars: selectedRating
            })
        });

        if (response.ok) {
            document.getElementById('feedback-section').innerHTML = `
                <p style="color: var(--success); font-weight: 700;">Thank you for your feedback! ❤️</p>
            `;
        }
    } catch (e) {
        console.error("Failed to submit feedback", e);
    }
}
