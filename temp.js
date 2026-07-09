
    /* ── Admin Users Tab Logic ── */
    const API = '';
    let usersState = { page: 1, limit: 20, search: '', role: '', total: 0 };
    let searchTimer = null;

    /* ── Load Users ── */
    async function loadUsers() {
      const token = localStorage.getItem('accessToken');
      const { page, limit, search, role } = usersState;

      const params = new URLSearchParams({ page, limit });
      if (search) params.set('search', search);
      if (role)   params.set('role', role);

      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = `<tr><td colspan="7" class="loader-spinner">⏳ Loading...</td></tr>`;

      try {
        const res = await fetch(`${API}/api/admin/users?${params}`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        usersState.total = data.pagination.total;

        // Badge
        const badge = document.getElementById('usersTotalBadge');
        if (badge) badge.textContent = `${data.pagination.total} users`;

        renderUsersTable(data.users);
        renderPagination(data.pagination);
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#f87171; padding:2rem;">${err.message}</td></tr>`;
      }
    }

    function renderUsersTable(users) {
      const tbody = document.getElementById('usersTableBody');
      if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="7">
          <div class="empty-state">
            <div class="empty-icon">👤</div>
            <div>No users found</div>
          </div>
        </td></tr>`;
        return;
      }

      tbody.innerHTML = users.map(u => {
        const initials = (u.name || 'U').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
        const avatarHtml = u.avatar_url
          ? `<img src="${escHtml(u.avatar_url)}" alt="${escHtml(u.name)}">`
          : initials;
        const roleCls = { admin: 'role-admin', seller: 'role-seller', customer: 'role-customer' }[u.role] || 'role-customer';
        const statusCls = u.is_active ? 'status-active' : 'status-inactive';
        const statusTxt = u.is_active ? '● Active' : '● Inactive';
        const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
        const spent = Number(u.total_spent || 0);

        return `<tr onclick="openUserModal('${escHtml(u.id)}')">
          <td>
            <div class="user-cell">
              <div class="user-mini-avatar">${avatarHtml}</div>
              <div>
                <div class="user-cell-name">${escHtml(u.name || '—')}</div>
                <div class="user-cell-email">${escHtml(u.email || '—')}</div>
              </div>
            </div>
          </td>
          <td><span class="role-badge ${roleCls}">${u.role}</span></td>
          <td><span class="status-toggle ${statusCls}">${statusTxt}</span></td>
          <td>${u.order_count || 0}</td>
          <td>₹${spent.toLocaleString('en-IN')}</td>
          <td>${joined}</td>
          <td onclick="event.stopPropagation()">
            <button class="tbl-action-btn" onclick="openUserModal('${escHtml(u.id)}')">View</button>
            <button class="tbl-action-btn ${u.is_active ? 'danger' : ''}" style="margin-left:0.4rem"
              onclick="quickToggle('${escHtml(u.id)}', ${!u.is_active})">
              ${u.is_active ? 'Disable' : 'Enable'}
            </button>
            <button class="tbl-action-btn danger" style="margin-left:0.4rem" onclick="deleteUser('${escHtml(u.id)}')">Delete</button>
          </td>
        </tr>`;
      }).join('');
    }

    function renderPagination({ page, totalPages, total, limit }) {
      const el = document.getElementById('usersPagination');
      const from = Math.min((page - 1) * limit + 1, total);
      const to   = Math.min(page * limit, total);
      el.innerHTML = `
        <span class="page-info">Showing ${from}–${to} of ${total}</span>
        <button class="page-btn" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>‹ Prev</button>
        ${Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return `<button class="page-btn ${p === page ? 'active' : ''}" onclick="changePage(${p})">${p}</button>`;
        }).join('')}
        <button class="page-btn" onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>Next ›</button>
      `;
    }

    function changePage(p) {
      usersState.page = p;
      loadUsers();
    }

    function debounceSearch() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        usersState.search = document.getElementById('userSearchInput').value.trim();
        usersState.page = 1;
        loadUsers();
      }, 400);
    }

    function setRoleFilter(role, btn) {
      usersState.role = role;
      usersState.page = 1;
      document.querySelectorAll('.role-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadUsers();
    }

    /* ── User Detail Modal ── */
    async function openUserModal(userId) {
      document.getElementById('userDetailOverlay').classList.add('open');
      document.getElementById('userDetailBody').innerHTML = `<div class="loader-spinner">⏳ Loading...</div>`;

      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${API}/api/admin/users/${userId}`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        renderUserDetail(data);
      } catch (err) {
        document.getElementById('userDetailBody').innerHTML =
          `<div style="color:#f87171; padding:1rem;">${err.message}</div>`;
      }
    }

    function renderUserDetail({ user, recentOrders, uploadedImages }) {
      const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
      const avatarHtml = user.avatar_url
        ? `<img src="${escHtml(user.avatar_url)}" alt="${escHtml(user.name)}">`
        : initials;
      const roleCls = { admin: 'role-admin', seller: 'role-seller', customer: 'role-customer' }[user.role] || 'role-customer';
      const statusCls = user.is_active ? 'status-active' : 'status-inactive';

      const joined    = user.created_at   ? new Date(user.created_at).toLocaleString('en-IN')   : '—';
      const lastLogin = user.last_login_at ? new Date(user.last_login_at).toLocaleString('en-IN') : 'Never';

      const ordersHtml = recentOrders.length
        ? `<table class="modal-orders-table">
            <thead><tr><th>Order ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>${recentOrders.map(o => `
              <tr>
                <td style="font-family:monospace; font-size:0.8rem;">#${o.id.substring(0,8).toUpperCase()}</td>
                <td>₹${Number(o.total_amount).toLocaleString('en-IN')}</td>
                <td><span class="status-badge ${o.status === 'pending' ? 'status-pending' : 'status-success'}">${o.status}</span></td>
                <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            `).join('')}</tbody>
          </table>`
        : `<div style="color:#6b7280; font-size:0.9rem; padding: 0.5rem 0;">No orders yet.</div>`;

      document.getElementById('userDetailBody').innerHTML = `
        <div class="modal-profile">
          <div class="modal-avatar">${avatarHtml}</div>
          <div class="modal-profile-info">
            <h3>${escHtml(user.name || '—')}</h3>
            <p>${escHtml(user.email || '—')}</p>
            <div class="modal-badges">
              <span class="role-badge ${roleCls}">${user.role}</span>
              <span class="status-toggle ${statusCls}">${user.is_active ? '● Active' : '● Inactive'}</span>
              ${user.email_verified ? '<span style="background:rgba(16,185,129,0.15);color:#34d399;padding:0.28rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;">✓ Verified</span>' : '<span style="background:rgba(239,68,68,0.1);color:#f87171;padding:0.28rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;">✗ Unverified</span>'}
            </div>
          </div>
        </div>

        <div class="modal-grid">
          <div class="modal-info-card">
            <div class="modal-info-label">User ID</div>
            <div class="modal-info-value" style="font-family:monospace;font-size:0.78rem;">${escHtml(user.id)}</div>
          </div>
          <div class="modal-info-card">
            <div class="modal-info-label">Language Preference</div>
            <div class="modal-info-value">${user.language_pref === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</div>
          </div>
          <div class="modal-info-card">
            <div class="modal-info-label">Joined</div>
            <div class="modal-info-value">${joined}</div>
          </div>
          <div class="modal-info-card">
            <div class="modal-info-label">Last Login</div>
            <div class="modal-info-value">${lastLogin}</div>
          </div>
          <div class="modal-info-card">
            <div class="modal-info-label">Total Orders</div>
            <div class="modal-info-value">${recentOrders.length >= 10 ? '10+' : recentOrders.length}</div>
          </div>
          <div class="modal-info-card">
            <div class="modal-info-label">Uploaded Images</div>
            <div class="modal-info-value">${uploadedImages}</div>
          </div>
        </div>

        <div class="modal-section-title">Recent Orders</div>
        ${ordersHtml}

        <div class="modal-actions">
          <select id="modalRoleSelect" style="background:#1f2937;border:1px solid #374151;color:#f3f4f6;padding:0.7rem 1rem;border-radius:8px;font-size:0.85rem;cursor:pointer;">
            <option value="customer" ${user.role==='customer'?'selected':''}>Customer</option>
            <option value="seller"   ${user.role==='seller'  ?'selected':''}>Seller</option>
            <option value="admin"    ${user.role==='admin'   ?'selected':''}>Admin</option>
          </select>
          <button class="action-btn-primary" onclick="saveUserRole('${escHtml(user.id)}')">Save Role</button>
          <button class="action-btn-secondary" onclick="quickToggle('${escHtml(user.id)}', ${!user.is_active}); closeUserModal()">
            ${user.is_active ? '🚫 Disable Account' : '✅ Enable Account'}
          </button>
          <button class="action-btn-danger" onclick="closeUserModal()">Close</button>
        </div>
      `;
    }

    function closeUserModal(event) {
      if (event && event.target !== document.getElementById('userDetailOverlay')) return;
      document.getElementById('userDetailOverlay').classList.remove('open');
    }

    /* ── Quick toggle active/inactive ── */
    async function quickToggle(userId, newStatus) {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${API}/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ is_active: newStatus })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast(`User ${newStatus ? 'enabled' : 'disabled'} successfully`);
        loadUsers();
      } catch (err) { showToast('Error: ' + err.message, true); }
    }

    /* ── Save role from modal ── */
    async function saveUserRole(userId) {
      const role = document.getElementById('modalRoleSelect').value;
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`${API}/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showToast('Role updated to ' + role);
        closeUserModal();
        loadUsers();
      } catch (err) { showToast('Error: ' + err.message, true); }
    }

    /* ── Toast Notification ── */
    function showToast(msg, isError = false) {
      let t = document.getElementById('adminToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'adminToast';
        t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);padding:0.9rem 2rem;border-radius:30px;font-size:0.85rem;font-weight:500;opacity:0;transition:all 0.3s;z-index:99999;letter-spacing:0.05em;';
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.style.background = isError ? '#7f1d1d' : '#C8A96A';
      t.style.color = isError ? '#fca5a5' : '#111';
      t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 3000);
    }

    /* ── Helper ── */
    function escHtml(str) {
      return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── Hook into tab switch to load users ── */
    const _origSwitch = window.switchTab;
    window.switchTab = function(tabId, el) {
      _origSwitch(tabId, el);
      if (tabId === 'users') loadUsers();
    };

    /* ── Hook into overview stats (patch dashboard.js output) ── */
    document.addEventListener('DOMContentLoaded', () => {
      // Override stat rendering for admin
      const origInit = document.body.onload;
    });

    /* Override stats to use our new IDs */
    window.__adminStatsLoaded = function(stats) {
      const r = document.getElementById('statRevenue');
      const p = document.getElementById('statProfit');
      const m = document.getElementById('statMargin');
      const u = document.getElementById('statUsers');
      const s = document.getElementById('statSellers');
      const o = document.getElementById('statProducts');
      
      const rev = Number(stats.revenue)||0;
      const prof = Number(stats.profit)||0;
      const margin = rev > 0 ? ((prof / rev) * 100).toFixed(1) : 0;

      if (r) r.textContent = '₹' + rev.toLocaleString('en-IN');
      if (p) p.textContent = '₹' + prof.toLocaleString('en-IN');
      if (m) m.textContent = margin + '%';
      if (u) u.textContent = stats.totalUsers || 0;
      if (s) s.textContent = stats.activeSellers || 0;
      if (o) o.textContent = stats.totalProducts || 0;

      const tbody = document.getElementById('recentOrdersBody');
      if (tbody && stats.recentOrders) {
        tbody.innerHTML = stats.recentOrders.length ? stats.recentOrders.map(o => `
          <tr>
            <td style="font-family:monospace;font-size:0.82rem;">#${o.order_id.substring(0,8).toUpperCase()}</td>
            <td>${escHtml(o.customer_name)}</td>
            <td>₹${Number(o.total_amount||0).toLocaleString('en-IN')}</td>
            <td><span class="status-badge ${o.status==='pending'?'status-pending':'status-success'}">${o.status}</span></td>
            <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
          </tr>
        `).join('')
        : `<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:2rem;">No orders yet</td></tr>`;
      }

      // Initialize Chart.js
      const ctx = document.getElementById('profitChart');
      if (ctx) {
        if (window.profitChartInst) window.profitChartInst.destroy();
        
        const costOfGoods = rev - (stats.grossProfit || 0);
        const expenses = stats.totalExpenses || 0;
        const netProfit = stats.profit || 0;

        window.profitChartInst = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Cost of Goods (₹)', 'Expenses (₹)', 'Net Profit (₹)'],
            datasets: [{
              data: [costOfGoods > 0 ? costOfGoods : 0, expenses, netProfit],
              backgroundColor: ['#374151', '#f59e0b', '#10b981'],
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: '#9ca3af' } }
            },
            cutout: '75%'
          }
        });
      }
    };

    /* ── Admin Products Tab Logic ── */
    let currentProductsPage = 1;
    let productsSearchQuery = '';

    async function loadProducts(page = 1) {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      try {
        const res = await fetch(`/api/admin/products?page=${page}&limit=20&search=${encodeURIComponent(productsSearchQuery)}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('currentUser');
          window.location.href = 'index.html';
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const data = await res.json();
        const tbody = document.getElementById('productsTableBody');
        const badge = document.getElementById('productsTotalBadge');
        const pag = document.getElementById('productsPagination');
        
        if (badge) badge.innerText = `${data.total} Products`;
        currentProductsPage = data.page;

        if (data.products.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#6b7280;">No products found</td></tr>`;
          pag.innerHTML = '';
          return;
        }

        tbody.innerHTML = data.products.map(p => `
          <tr>
            <td>
              <img src="${p.image_url || 'https://via.placeholder.com/40'}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;border:1px solid #374151;">
            </td>
            <td>${escHtml(p.name)}</td>
            <td>₹${Number(p.price).toLocaleString('en-IN')}</td>
            <td>₹${Number(p.cost_price||0).toLocaleString('en-IN')}</td>
            <td>${p.stock}</td>
            <td>
              <button class="tbl-action-btn" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
              <button class="tbl-action-btn danger" onclick="deleteProduct('${p.id}')">Delete</button>
            </td>
          </tr>
        `).join('');

        // Pagination UI
        let pagHtml = `<button class="page-btn" ${data.page === 1 ? 'disabled' : ''} onclick="loadProducts(${data.page - 1})">Prev</button>`;
        pagHtml += `<span class="page-info">Page ${data.page} of ${data.totalPages || 1}</span>`;
        pagHtml += `<button class="page-btn" ${data.page === data.totalPages || data.totalPages === 0 ? 'disabled' : ''} onclick="loadProducts(${data.page + 1})">Next</button>`;
        pag.innerHTML = pagHtml;

      } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:2rem;">Error loading products</td></tr>`;
      }
    }

    let searchProdTimeout;
    function handleProductSearch(e) {
      clearTimeout(searchProdTimeout);
      productsSearchQuery = e.target.value;
      searchProdTimeout = setTimeout(() => {
        loadProducts(1);
      }, 300);
    }

    function openProductModal() {
      document.getElementById('productForm').reset();
      document.getElementById('prodId').value = '';
      document.getElementById('productModalTitle').innerText = 'Add New Product';
      document.getElementById('productModalOverlay').classList.add('open');
    }

    function closeProductModal(e) {
      if (e && e.target !== document.getElementById('productModalOverlay')) return;
      document.getElementById('productModalOverlay').classList.remove('open');
    }

    function editProduct(prod) {
      document.getElementById('prodId').value = prod.id;
      document.getElementById('prodName').value = prod.name;
      document.getElementById('prodPrice').value = prod.price;
      document.getElementById('prodCost').value = prod.cost_price;
      document.getElementById('prodStock').value = prod.stock;
      document.getElementById('prodSeller').value = prod.seller_id || '';
      document.getElementById('prodImage').value = prod.image_url || '';
      document.getElementById('prodImageFile').value = '';
      document.getElementById('uploadProgress').innerText = '';
      
      document.getElementById('productModalTitle').innerText = 'Edit Product';
      document.getElementById('productModalOverlay').classList.add('open');
    }

    async function saveProduct(e) {
      e.preventDefault();
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const id = document.getElementById('prodId').value;
      let finalImageUrl = document.getElementById('prodImage').value;

      try {
        const btn = document.getElementById('prodSaveBtn');
        btn.innerText = 'Saving...';
        btn.disabled = true;

        // Handle file upload if file is selected
        const fileInput = document.getElementById('prodImageFile');
        if (fileInput.files.length > 0) {
          document.getElementById('uploadProgress').innerText = 'Uploading image...';
          const formData = new FormData();
          formData.append('image', fileInput.files[0]);
          if (id) formData.append('product_id', id);

          const upRes = await fetch('/api/upload/product-image', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
          });
          if (!upRes.ok) {
            let errMsg = 'Image upload failed';
            try {
              const errData = await upRes.json();
              if (errData.error) errMsg = errData.error;
            } catch(e) {}
            throw new Error(errMsg);
          }
          const upData = await upRes.json();
          finalImageUrl = upData.image.url;
          document.getElementById('uploadProgress').innerText = 'Upload successful!';
        }

        const payload = {
          name: document.getElementById('prodName').value,
          price: parseFloat(document.getElementById('prodPrice').value),
          cost_price: parseFloat(document.getElementById('prodCost').value) || 0,
          stock: parseInt(document.getElementById('prodStock').value) || 0,
          seller_id: document.getElementById('prodSeller').value || null,
          image_url: finalImageUrl
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/products/${id}` : `/api/admin/products`;

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to save product');
        
        closeProductModal();
        loadProducts(currentProductsPage);
        
        // Refresh dashboard stats if viewing overview
        if (typeof window.location !== 'undefined') {
          showToast('Product saved successfully');
        }
      } catch (err) {
        alert(err.message);
      } finally {
        const btn = document.getElementById('prodSaveBtn');
        btn.innerText = 'Save Product';
        btn.disabled = false;
      }
    }

    async function deleteProduct(id) {
      if (!confirm('Are you sure you want to delete this product?')) return;
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Failed to delete product');
        showToast('Product deleted');
        loadProducts(currentProductsPage);
      } catch (err) {
        alert(err.message);
      }
    }

    // Call loadProducts when tab opens (we hook into switchTab via MutationObserver or click event ideally, 
    // but for simplicity we'll just add it to the window load for now or let the user click)
    document.getElementById('nav-products').addEventListener('click', () => {
      loadProducts(1);
    });

    // ── Admin: Users (Add/Delete) ──
    function openAddUserModal() {
      document.getElementById('addUserForm').reset();
      document.getElementById('addUserOverlay').classList.add('open');
    }
    function closeAddUserModal(e) {
      if (e && e.target !== document.getElementById('addUserOverlay')) return;
      document.getElementById('addUserOverlay').classList.remove('open');
    }
    async function saveNewUser(e) {
      e.preventDefault();
      const token = localStorage.getItem('accessToken');
      const payload = {
        name: document.getElementById('addUserName').value,
        email: document.getElementById('addUserEmail').value,
        password: document.getElementById('addUserPassword').value,
        role: document.getElementById('addUserRole').value
      };
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create user');
        }
        closeAddUserModal();
        showToast('User created successfully');
        loadUsers(currentUsersPage);
      } catch (err) { alert(err.message); }
    }
    async function deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user? This may break related orders.')) return;
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to delete user');
        showToast('User deleted');
        loadUsers(currentUsersPage);
      } catch (err) { alert(err.message); }
    }

    // Hook delete button into the users table mapping: We need to modify `dashboard-admin.html` loadUsers mapping...
    // I will overwrite loadUsers via monkey-patching or assume it's in the previous block.
    // Let's redefine `loadUsers` if possible, or we will just modify it using another replace_file_content if needed.

    // ── Admin: Orders ──
    async function loadOrders() {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch('/api/admin/orders', { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const orders = await res.json();
        const tbody = document.getElementById('ordersTableBody');
        if (orders.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#6b7280;">No orders found</td></tr>`;
          return;
        }
        tbody.innerHTML = orders.map(o => `
          <tr>
            <td>#${o.id.substring(0, 8).toUpperCase()}</td>
            <td>${escHtml(o.customer_name)} <br><span style="font-size:0.75rem;color:#9ca3af">${escHtml(o.customer_email)}</span></td>
            <td>₹${Number(o.total_amount).toLocaleString('en-IN')}</td>
            <td>
              <select onchange="updateOrderStatus('${o.id}', this.value)" style="background:#1f2937; border:1px solid #374151; color:#fff; padding:0.2rem; border-radius:4px;">
                <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td>
              <button class="tbl-action-btn danger" onclick="deleteOrder('${o.id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      } catch (err) { console.error(err); }
    }
    async function updateOrderStatus(id, status) {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Failed to update status');
        showToast('Order status updated');
      } catch (err) { alert(err.message); }
    }
    async function deleteOrder(id) {
      if (!confirm('Are you sure you want to delete this order?')) return;
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to delete order');
        showToast('Order deleted');
        loadOrders();
      } catch (err) { alert(err.message); }
    }
    document.getElementById('nav-orders').addEventListener('click', loadOrders);

    // ── Admin: Expenses ──
    async function loadExpenses() {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch('/api/admin/expenses', { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to fetch expenses');
        const expenses = await res.json();
        const tbody = document.getElementById('expensesTableBody');
        if (expenses.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#6b7280;">No expenses found</td></tr>`;
          return;
        }
        tbody.innerHTML = expenses.map(e => `
          <tr>
            <td><span class="role-badge" style="background:rgba(200,169,106,0.15);color:#C8A96A;">${e.category.replace('_', ' ').toUpperCase()}</span></td>
            <td>₹${Number(e.amount).toLocaleString('en-IN')}</td>
            <td>${escHtml(e.description || '')}</td>
            <td>${new Date(e.created_at).toLocaleDateString()}</td>
            <td>
              <button class="tbl-action-btn" onclick='openExpenseModal(${JSON.stringify(e).replace(/'/g, "&#39;")})'>Edit</button>
              <button class="tbl-action-btn danger" onclick="deleteExpense('${e.id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      } catch (err) { console.error(err); }
    }
    function openExpenseModal(expense = null) {
      document.getElementById('expenseForm').reset();
      if (expense) {
        document.getElementById('expenseId').value = expense.id;
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDescription').value = expense.description;
        document.getElementById('expenseModalTitle').innerText = 'Edit Expense';
      } else {
        document.getElementById('expenseId').value = '';
        document.getElementById('expenseModalTitle').innerText = 'Add Expense';
      }
      document.getElementById('expenseModalOverlay').classList.add('open');
    }
    function closeExpenseModal(e) {
      if (e && e.target !== document.getElementById('expenseModalOverlay')) return;
      document.getElementById('expenseModalOverlay').classList.remove('open');
    }
    async function saveExpense(e) {
      e.preventDefault();
      const token = localStorage.getItem('accessToken');
      const id = document.getElementById('expenseId').value;
      const payload = {
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        description: document.getElementById('expenseDescription').value
      };
      try {
        const res = await fetch(id ? `/api/admin/expenses/${id}` : '/api/admin/expenses', {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save expense');
        closeExpenseModal();
        showToast('Expense saved');
        loadExpenses();
      } catch (err) { alert(err.message); }
    }
    async function deleteExpense(id) {
      if (!confirm('Are you sure you want to delete this expense?')) return;
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to delete expense');
        showToast('Expense deleted');
        loadExpenses();
      } catch (err) { alert(err.message); }
    }
    document.getElementById('nav-expenses').addEventListener('click', loadExpenses);

    // ── Admin: Reports ──
    async function loadReports() {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch('/api/admin/reports', { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to fetch reports');
        const reports = await res.json();
        const tbody = document.getElementById('reportsTableBody');
        if (reports.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:#6b7280;">No reports generated yet</td></tr>`;
          return;
        }
        tbody.innerHTML = reports.map(r => `
          <tr>
            <td><strong>${escHtml(r.name)}</strong></td>
            <td>${new Date(r.start_date).toLocaleDateString()} to ${new Date(r.end_date).toLocaleDateString()}</td>
            <td>${new Date(r.created_at).toLocaleDateString()}</td>
            <td>
              <button class="tbl-action-btn" style="background:rgba(16,185,129,0.15);color:#10b981;border-color:#10b981;padding:0.3rem 0.6rem;margin-right:0.4rem;" onclick="downloadPdf('${r.id}')">Download PDF</button>
              <button class="tbl-action-btn danger" onclick="deleteReport('${r.id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      } catch (err) { console.error(err); }
    }
    
    async function downloadPdf(id) {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`/api/admin/reports/${id}/pdf`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Failed to download PDF');
        
        let filename = 'report.pdf';
        const disposition = res.headers.get('Content-Disposition');
        if (disposition && disposition.indexOf('attachment') !== -1) {
          const matches = /filename="([^"]*)"/.exec(disposition);
          if (matches && matches[1]) filename = matches[1];
        }
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) { alert(err.message); }
    }

    function openReportModal() {
      document.getElementById('reportForm').reset();
      document.getElementById('reportModalOverlay').classList.add('open');
    }
    function closeReportModal(e) {
      if (e && e.target !== document.getElementById('reportModalOverlay')) return;
      document.getElementById('reportModalOverlay').classList.remove('open');
    }
    async function generateReport(e) {
      e.preventDefault();
      const token = localStorage.getItem('accessToken');
      const payload = {
        name: document.getElementById('reportName').value,
        start_date: document.getElementById('reportStartDate').value,
        end_date: document.getElementById('reportEndDate').value
      };
      try {
        const res = await fetch('/api/admin/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'Failed to generate report');
        }
        closeReportModal();
        showToast('Report generated successfully');
        loadReports();
      } catch (err) { alert(err.message); }
    }
    async function deleteReport(id) {
      if (!confirm('Are you sure you want to delete this report?')) return;
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error('Failed to delete report');
        showToast('Report deleted');
        loadReports();
      } catch (err) { alert(err.message); }
    }
    document.getElementById('nav-reports').addEventListener('click', loadReports);

    // Simple toast function if not available
    function showToast(msg) {
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#10b981;color:#fff;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 10px 15px rgba(0,0,0,0.2);z-index:9999;font-size:0.9rem;transition:opacity 0.3s;';
      toast.innerText = msg;
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; setTimeout(()=>toast.remove(), 300); }, 3000);
    }
    // ── Admin Add Order Logic ──
    let productsListCache = [];
    
    async function openAddOrderModal() {
      document.getElementById('addOrderForm').reset();
      document.getElementById('orderItemsContainer').innerHTML = '';
      document.getElementById('addOrderModal').style.display = 'flex';
      
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
        if(res.ok) {
          const users = await res.json();
          const select = document.getElementById('newOrderCustomer');
          select.innerHTML = '<option value="">-- Select a Customer --</option>' + 
            users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
        }
      } catch (err) { console.error('Error fetching users', err); }
      
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/admin/products', { headers: { 'Authorization': 'Bearer ' + token } });
        if(res.ok) {
          productsListCache = await res.json();
        }
      } catch (err) { console.error('Error fetching products', err); }
      
      addOrderItemRow(); 
    }

    function closeAddOrderModal() {
      document.getElementById('addOrderModal').style.display = 'none';
    }

    function addOrderItemRow() {
      const container = document.getElementById('orderItemsContainer');
      const div = document.createElement('div');
      div.className = 'order-item-row';
      div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-end;';
      
      const prodOptions = productsListCache.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price}</option>`).join('');
      
      div.innerHTML = `
        <div style="flex: 2;">
          <label style="font-size: 0.8rem; color: #a1a1aa;">Product</label>
          <select class="item-product" required onchange="updateRowPrice(this)" style="padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; border-radius: 6px;">
            <option value="">-- Select Product --</option>
            ${prodOptions}
          </select>
        </div>
        <div style="flex: 1;">
          <label style="font-size: 0.8rem; color: #a1a1aa;">Qty</label>
          <input type="number" class="item-qty" value="1" min="1" required style="padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; border-radius: 6px;">
        </div>
        <div style="flex: 1;">
          <label style="font-size: 0.8rem; color: #a1a1aa;">Price</label>
          <input type="number" class="item-price" step="0.01" required style="padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; border-radius: 6px;">
        </div>
        <div>
          <button type="button" class="tbl-action-btn danger" onclick="this.parentElement.parentElement.remove()" style="padding: 0.8rem;">&times;</button>
        </div>
      `;
      container.appendChild(div);
    }

    function updateRowPrice(selectElem) {
      const option = selectElem.options[selectElem.selectedIndex];
      const price = option.getAttribute('data-price');
      const row = selectElem.closest('.order-item-row');
      if (price && row) {
        row.querySelector('.item-price').value = price;
      }
    }

    async function submitNewOrder(e) {
      e.preventDefault();
      const customer_id = document.getElementById('newOrderCustomer').value;
      const status = document.getElementById('newOrderStatus').value;
      
      const rows = document.querySelectorAll('.order-item-row');
      const items = [];
      rows.forEach(row => {
        const product_id = row.querySelector('.item-product').value;
        const quantity = row.querySelector('.item-qty').value;
        const price = row.querySelector('.item-price').value;
        if(product_id && quantity && price) {
          items.push({ product_id, quantity, price });
        }
      });
      
      if(items.length === 0) {
        return alert('Please add at least one item');
      }
      
      const payload = { customer_id, status, items };
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(payload)
        });
        if(!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create order');
        }
        closeAddOrderModal();
        showToast('Order created successfully');
        if (typeof loadOrders === 'function') {
          loadOrders();
        } else {
          location.reload();
        }
      } catch (err) {
        alert(err.message);
      }
    }
  