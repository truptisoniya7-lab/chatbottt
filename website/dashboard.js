document.addEventListener("DOMContentLoaded", async () => {
  // 1. Auth Guard
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const token = localStorage.getItem('accessToken');
  
  if (!currentUser || !token) {
    alert("Unauthorized access. Please log in first.");
    window.location.href = "index.html";
    return;
  }

  // 2. Hydrate Header
  const nameEl = document.getElementById('dashUserName');
  const roleEl = document.getElementById('dashUserRole');
  const avatarEl = document.getElementById('dashUserAvatar');

  if (nameEl) nameEl.innerText = currentUser.name;
  if (roleEl) roleEl.innerText = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  if (avatarEl) avatarEl.innerText = currentUser.name.charAt(0).toUpperCase();

  // 3. Simple protection
  const path = window.location.pathname;
  if (path.includes('dashboard-admin.html') && currentUser.role !== 'admin') {
    window.location.href = `dashboard-${currentUser.role}.html`;
  } else if (path.includes('dashboard-seller.html') && currentUser.role !== 'seller') {
    window.location.href = `dashboard-${currentUser.role}.html`;
  } else if (path.includes('dashboard-user.html') && currentUser.role !== 'customer') {
    window.location.href = `dashboard-${currentUser.role}.html`;
  }

  try {
    const res = await fetch('/api/dashboard/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
      return;
    }
    if (!res.ok) throw new Error('Failed to fetch stats');
    const stats = await res.json();
    
    // Populate Admin DOM
    if (currentUser.role === 'admin') {
      // Call the hook defined in dashboard-admin.html if it exists
      if (typeof window.__adminStatsLoaded === 'function') {
        window.__adminStatsLoaded(stats);
      } else {
        // Fallback: original behaviour for other pages
        const els = document.querySelectorAll('.stat-value');
        const revenue = Number(stats.revenue) || 0;
        if(els[0]) els[0].innerText = `₹${revenue.toLocaleString('en-IN')}`;
        if(els[1]) els[1].innerText = stats.totalUsers || stats.activeSellers || 0;
        if(els[2]) els[2].innerText = stats.activeSellers || 0;
        if(els[3]) els[3].innerText = stats.totalOrders || 0;
      }
      
      const tbody = document.querySelector('.dash-table tbody') || document.getElementById('recentOrdersBody');
      if (tbody && stats.recentOrders) {
        tbody.innerHTML = stats.recentOrders.map(o => `
          <tr>
            <td>#${o.order_id.substring(0, 8).toUpperCase()}</td>
            <td>Multiple Items</td>
            <td>${o.customer_name}</td>
            <td><span class="status-badge status-${o.status === 'pending' ? 'pending' : 'success'}">${o.status}</span></td>
            <td><a href="#" style="color: var(--text-muted); text-decoration: none;">View</a></td>
          </tr>
        `).join('');
      }
    }
    // Populate Seller DOM
    else if (currentUser.role === 'seller') {
      const els = document.querySelectorAll('.stat-value');
      if(els[0]) els[0].innerText = `₹${stats.revenue.toLocaleString('en-IN')}`;
      if(els[1]) els[1].innerText = stats.productsListed;
      if(els[2]) els[2].innerText = stats.pendingOrders;
      
      const tbody = document.querySelector('.dash-table tbody');
      if (tbody && stats.recentOrders.length > 0) {
        // Mock seller items rendering...
      }
    }
    // Populate Customer DOM
    else if (currentUser.role === 'customer') {
      const els = document.querySelectorAll('.stat-value');
      if(els[0]) els[0].innerText = stats.ordersPlaced;
      
      const tbody = document.querySelector('.dash-table tbody');
      if (tbody) {
        tbody.innerHTML = stats.orderHistory.map(o => {
          const isShipped = o.status !== 'pending';
          const isDelivered = o.status === 'delivered';
          return `
          <tr>
            <td>#${o.id.substring(0, 8).toUpperCase()}</td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td>Multiple Items</td>
            <td>₹${o.total_amount.toLocaleString('en-IN')}</td>
            <td><span class="status-badge status-${o.status === 'pending' ? 'pending' : 'success'}">${o.status}</span></td>
            <td>
              <div class="order-tracker">
                <div class="tracker-step active">
                  <div class="tracker-dot"></div><span class="tracker-label">Processed</span>
                </div>
                <div class="tracker-line ${isShipped ? 'active' : ''}"></div>
                <div class="tracker-step ${isShipped ? 'active' : ''}">
                  <div class="tracker-dot"></div><span class="tracker-label">Shipped</span>
                </div>
                <div class="tracker-line ${isDelivered ? 'active' : ''}"></div>
                <div class="tracker-step ${isDelivered ? 'active' : ''}">
                  <div class="tracker-dot"></div><span class="tracker-label">Delivered</span>
                </div>
              </div>
            </td>
          </tr>
        `}).join('');
      }
      
      // Render Wishlist
      const wishlistKey = currentUser && currentUser.email ? 'wishlist_' + currentUser.email : 'wishlist';
      const wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
      
      if(els[1]) els[1].innerText = wishlist.length;
      const viewWishlist = document.getElementById('view-wishlist');
      if (viewWishlist) {
        if (wishlist.length === 0) {
          viewWishlist.innerHTML = `
            <div class="dash-section-title">My Saved Items</div>
            <div class="customer-empty-state">
              <div class="empty-icon">✨</div>
              <div class="empty-title">Your wishlist is empty...</div>
              <p>Discover the latest trends on the home page!</p>
              <a href="index.html" class="customer-btn-primary">Continue Shopping</a>
            </div>
          `;
        } else {
          viewWishlist.innerHTML = `
            <div class="dash-section-title">My Saved Items</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
              ${wishlist.map(item => `
                <div style="background: var(--plum); border: 1px solid var(--plum-mid); border-radius: 8px; overflow: hidden; transition: 0.3s;" onmouseover="this.style.borderColor='var(--gold-glow)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)';" onmouseout="this.style.borderColor='var(--plum-mid)'; this.style.boxShadow='none';">
                  <div class="${item.imageClass}" style="height: 300px; background-size: cover; background-position: center;"></div>
                  <div style="padding: 1rem;">
                    <div style="font-weight: 500; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--gold);">${item.name}</div>
                    <div style="color: var(--text-pearl); font-weight: 500; margin-bottom: 1rem;">₹${item.price.toLocaleString('en-IN')}</div>
                    <button class="customer-btn-outline" style="margin-top:0; padding: 0.8rem;" onclick="alert('Moved to cart!');">Move to Cart</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // If stats failed to load, update the UI to avoid being stuck on 'Loading...'
    const els = document.querySelectorAll('.stat-value');
    els.forEach(el => {
      if (el.innerText === '' || el.innerText === '₹0' || el.innerText === '0') {
        el.innerText = '—';
      }
    });
    const tbody = document.querySelector('.dash-table tbody') || document.getElementById('recentOrdersBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444; padding: 2rem;">Error loading data. Please refresh or log in again.</td></tr>`;
    }
  }
});

// Logout Function
window.logout = async function() {
  try {
    await fetch('/auth/logout', { method: 'POST' });
  } catch(e) {}
  localStorage.removeItem('accessToken');
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
};

// Sidebar Toggle Function for Mobile Layouts
window.toggleSidebar = function() {
  const sidebar = document.querySelector('.dash-sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
};

// Tab Switching Function for Dashboards
window.switchTab = function(tabId, element) {
  // Update active state in sidebar
  document.querySelectorAll('.dash-nav a').forEach(el => el.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }

  // Hide all views and show the selected one
  document.querySelectorAll('.dash-view').forEach(el => {
    el.style.display = 'none';
  });
  
  const selectedView = document.getElementById('view-' + tabId);
  if (selectedView) {
    selectedView.style.display = 'block';
  }

  // Auto-close sidebar on mobile after clicking a link
  const sidebar = document.querySelector('.dash-sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
  if (overlay && overlay.classList.contains('open')) {
    overlay.classList.remove('open');
  }
};
