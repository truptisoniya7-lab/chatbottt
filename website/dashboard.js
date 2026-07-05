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

  // 4. Fetch Real Stats from Backend
  try {
    const res = await fetch('/api/dashboard/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    const stats = await res.json();
    
    // Populate Admin DOM
    if (currentUser.role === 'admin') {
      const els = document.querySelectorAll('.stat-value');
      const revenue = Number(stats.revenue) || 0;
      if(els[0]) els[0].innerText = `₹${revenue.toLocaleString('en-IN')}`;
      if(els[1]) els[1].innerText = stats.activeSellers || 0;
      if(els[2]) els[2].innerText = stats.totalOrders || 0;
      
      const tbody = document.querySelector('.dash-table tbody');
      if (tbody) {
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
        tbody.innerHTML = stats.orderHistory.map(o => `
          <tr>
            <td>#${o.id.substring(0, 8).toUpperCase()}</td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td>Multiple Items</td>
            <td>₹${o.total_amount.toLocaleString('en-IN')}</td>
            <td><span class="status-badge status-${o.status === 'pending' ? 'pending' : 'success'}">${o.status}</span></td>
          </tr>
        `).join('');
      }
      
      // Render Wishlist
      const wishlistKey = currentUser && currentUser.email ? 'wishlist_' + currentUser.email : 'wishlist';
      const wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
      
      if(els[1]) els[1].innerText = wishlist.length;
      const viewWishlist = document.getElementById('view-wishlist');
      if (viewWishlist) {
        if (wishlist.length === 0) {
          viewWishlist.innerHTML = `
            <div class="dash-section-title" style="color: #831843;">Saved Items</div>
            <div style="background: rgba(255, 255, 255, 0.9); padding: 3rem; text-align: center; border-radius: 8px; border: 1px solid #f9a8d4; box-shadow: 0 4px 6px -1px rgba(244,114,182,0.1); backdrop-filter: blur(4px);">
              <div style="font-size: 3rem; color: #f472b6; margin-bottom: 1rem;">🎀</div>
              <div style="font-size: 1.2rem; font-family: 'Cormorant Garamond', serif; margin-bottom: 0.5rem; color: #831843;">Your wishlist is empty...</div>
              <div style="color: #be185d; margin-bottom: 2rem; font-size: 0.9rem;">
                Discover the latest trends on the home page!
              </div>
              <a href="index.html" style="background: #f472b6; color: white; padding: 0.8rem 1.5rem; border-radius: 4px; text-decoration: none; font-weight: 500; display: inline-block; box-shadow: 0 2px 4px rgba(244,114,182,0.3);">Continue Shopping</a>
            </div>
          `;
        } else {
          viewWishlist.innerHTML = `
            <div class="dash-section-title" style="color: #831843;">My Saved Items</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
              ${wishlist.map(item => `
                <div style="background: rgba(255, 255, 255, 0.9); border: 1px solid #f9a8d4; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(244,114,182,0.1); backdrop-filter: blur(4px);">
                  <div class="${item.imageClass}" style="height: 300px; background-size: cover; background-position: center;"></div>
                  <div style="padding: 1rem;">
                    <div style="font-weight: 500; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; margin-bottom: 0.5rem; color: #831843;">${item.name}</div>
                    <div style="color: #db2777; font-weight: 500; margin-bottom: 1rem;">₹${item.price.toLocaleString('en-IN')}</div>
                    <button style="width: 100%; background: #fdf2f8; color: #db2777; border: 1px dashed #f472b6; padding: 0.8rem; border-radius: 4px; cursor: pointer; transition: 0.3s; font-weight: 500;" onmouseover="this.style.background='#fce7f3'" onmouseout="this.style.background='#fdf2f8'" onclick="alert('Moved to cart!');">Move to Cart</button>
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
};
