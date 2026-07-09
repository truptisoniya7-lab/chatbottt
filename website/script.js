
window.safeStorage = {
  getItem: function(k) { try { return localStorage.getItem(k); } catch(e) { return null; } },
  setItem: function(k, v) { try { localStorage.setItem(k, v); } catch(e) {} },
  removeItem: function(k) { try { localStorage.removeItem(k); } catch(e) {} }
};
/* ============================================================
   VASUDHA COUTURE 3D — script.js
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // ── PAGE LOADER ──
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }, 2000);
  } else {
    document.body.style.overflow = 'auto';
  }


  // ── NAV SCROLL STATE ──
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });


  // ── THREE.JS HERO PARTICLES ──
  const canvas = document.getElementById('hero-canvas');
  if (canvas && typeof THREE !== 'undefined') {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700; // number of gold dust particles
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      // Spread particles in a 3D volume
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Particle material
    const material = new THREE.PointsMaterial({
      size: 0.015,
      color: 0xC8A96A, // Gold color
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    camera.position.z = 2;

    // Mouse interaction for particles
    let pMouseX = 0;
    let pMouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
      pMouseX = (event.clientX - windowHalfX) * 0.0005;
      pMouseY = (event.clientY - windowHalfY) * 0.0005;
    });

    // Animation Loop
    const clock = new THREE.Clock();

    const animateParticles = () => {
      const elapsedTime = clock.getElapsedTime();

      // Slowly rotate the entire particle field
      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x = elapsedTime * 0.02;

      // Ease towards mouse position for parallax effect
      targetX = pMouseX * 0.5;
      targetY = pMouseY * 0.5;
      
      particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
      particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

      renderer.render(scene, camera);
      requestAnimationFrame(animateParticles);
    };

    animateParticles();

    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }


  // ── 3D TILT EFFECT FOR CARDS ──
  const tiltCards = document.querySelectorAll('.tilt-card');
  
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation (max 15 degrees)
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });


  // ── SCROLL REVEAL ANIMATIONS ──
  const reveals = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 100;
    
    reveals.forEach(reveal => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('active');
      }
    });
  };
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Trigger once on load
});


// ── TOAST NOTIFICATIONS ──
let toastTimeout;
window.showToast = function(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
};


// ── FILTER TABS (Trending Section) ──
window.setTab = function(btn) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  showToast('Filtering collections...');
};

/* ============================================================
   AUTHENTICATION LOGIC (Client-Side Simulation)
   ============================================================ */
window.currentUser = null;
let token = window.safeStorage.getItem('accessToken');
try {
  window.currentUser = JSON.parse(window.safeStorage.getItem('currentUser'));
} catch (e) {}

window.getCartKey = function() {
  return window.currentUser && window.currentUser.email ? 'shoppingCart_' + window.currentUser.email : 'shoppingCart';
};
window.getWishlistKey = function() {
  return window.currentUser && window.currentUser.email ? 'wishlist_' + window.currentUser.email : 'wishlist';
};

// If they have one but not the other, clear it (handles legacy fake-logins)
if ((window.currentUser && !token) || (!window.currentUser && token)) {
  window.safeStorage.removeItem('currentUser');
  window.safeStorage.removeItem('accessToken');
  window.currentUser = null;
  token = null;
}

window.openAuthModal = function() {
  if (window.currentUser && token) {
    if (window.currentUser.role === 'admin') window.location.href = 'dashboard-admin.html';
    else if (window.currentUser.role === 'seller') window.location.href = 'dashboard-seller.html';
    else window.location.href = 'dashboard-user.html';
    return;
  }
  document.getElementById('authOverlay').classList.add('active');
};

document.addEventListener("DOMContentLoaded", () => {
  const authBtn = document.getElementById('authNavBtn');
  if (authBtn && currentUser) {
    authBtn.innerText = 'My Account';
  }
});

window.closeAuthModal = function(e) {
  if (e && e.target !== document.getElementById('authOverlay')) return;
  document.getElementById('authOverlay').classList.remove('active');
};

window.switchAuthTab = function(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'login') {
    tabs[0].classList.add('active');
    document.getElementById('signupFields').style.display = 'none';
    document.getElementById('authSubmitBtn').innerText = 'Log In';
  } else {
    tabs[1].classList.add('active');
    document.getElementById('signupFields').style.display = 'flex';
    document.getElementById('authSubmitBtn').innerText = 'Sign Up';
  }
};

window.handleAuthSubmit = async function(e) {
  e.preventDefault();
  
  // Use the active tab to determine if it's a signup request (more robust than checking button text)
  const tabs = document.querySelectorAll('.auth-tab');
  const isSignup = tabs[1] && tabs[1].classList.contains('active');
  
  const role = document.querySelector('input[name="role"]:checked').value;
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName') ? document.getElementById('authName').value : email.split('@')[0];
  
  const endpoint = '' + (isSignup ? '/auth/register' : '/auth/login');
  const payload = isSignup ? { name, email, password, role } : { email, password };
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    
    if (response.ok) {
      if (isSignup) {
        showToast('Account created! Please log in.');
        switchAuthTab('login');
      } else {
        // Enforce admin role strictly
        if (data.user.email === 'truptisoniya7@gmail.com') {
          data.user.role = 'admin';
        } else if (data.user.role === 'admin') {
          data.user.role = 'customer'; // Deny admin to anyone else
        }

        window.safeStorage.setItem('currentUser', JSON.stringify(data.user));
        window.safeStorage.setItem('accessToken', data.accessToken);
        
        // Redirect based on role
        if (data.user.role === 'admin') window.location.href = 'dashboard-admin.html';
        else if (data.user.role === 'seller') window.location.href = 'dashboard-seller.html';
        else window.location.href = 'dashboard-user.html';
      }
    } else {
      showToast('Error: ' + (data.error || 'Authentication failed'));
    }
  } catch (error) {
    showToast('Network error: Could not connect to server.');
    console.error(error);
  }
};


/* ============================================================
   SHOPPING CART LOGIC (Client-Side State)
   ============================================================ */
let cart = [];
try {
  cart = JSON.parse(window.safeStorage.getItem(window.getCartKey())) || [];
} catch (e) {
  cart = [];
}

window.toggleCart = function() {
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  
  if (sidebar.classList.contains('active')) {
    overlay.classList.remove('active');
    sidebar.classList.remove('active');
  } else {
    renderCart();
    overlay.classList.add('active');
    sidebar.classList.add('active');
  }
};

window.addToCart = function(name, price) {
  // Check if item exists
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  
  saveCart();
  showToast(`Added ${name} to cart!`);
  
  // Update Nav Counter
  document.getElementById('navCartBtn').innerText = `Cart (${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
};

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
};

function saveCart() {
  window.safeStorage.setItem(window.getCartKey(), JSON.stringify(cart));
  document.getElementById('navCartBtn').innerText = `Cart (${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const totalVal = document.getElementById('cartTotalVal');
  
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    totalVal.innerText = '₹0';
    return;
  }
  
  let html = '';
  let total = 0;
  
  cart.forEach((item, index) => {
    total += (item.price * item.quantity);
    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')} x ${item.quantity}</div>
          <button class="cart-item-remove" onclick="removeFromCart(${index})">Remove</button>
        </div>
        <div style="font-weight: 500;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  totalVal.innerText = `₹${total.toLocaleString('en-IN')}`;
}

window.buyNow = function(name, price) {
  addToCart(name, price);
  if (!window.currentUser) {
    showToast('Please log in to complete purchase');
    openAuthModal();
  } else {
    toggleCart();
  }
};

window.checkout = async function() {
  if (cart.length === 0) {
    showToast('Add items to cart first!');
    return;
  }
  if (!window.currentUser) {
    showToast('Please log in to checkout');
    toggleCart(); // Close cart
    openAuthModal(); // Open login
    return;
  }
  
  const btn = document.querySelector('.checkout-btn');
  btn.innerText = 'Processing...';
  btn.disabled = true;

  try {
    const token = window.safeStorage.getItem('accessToken');
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ cart })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Order placed successfully! Order ID: ' + data.orderId);
      cart = [];
      saveCart();
      toggleCart();
    } else {
      showToast('Checkout failed: ' + (data.error || 'Unknown error'));
      if (response.status === 401) {
        // Token expired
        window.safeStorage.removeItem('currentUser');
        window.safeStorage.removeItem('accessToken');
        openAuthModal();
      }
    }
  } catch (err) {
    console.error(err);
    showToast('Network error during checkout');
  } finally {
    btn.innerText = 'Proceed to Checkout';
    btn.disabled = false;
  }
};

/* ============================================================
   QUICK VIEW & WISHLIST LOGIC
   ============================================================ */
let wishlist = [];
try {
  wishlist = JSON.parse(window.safeStorage.getItem(window.getWishlistKey())) || [];
} catch (e) {
  wishlist = [];
}

window.openQuickView = function(name, price, imageClass, oldPrice, tag, imageUrl) {
  document.getElementById('qvName').innerText = name;
  document.getElementById('qvTag').innerText = tag || 'Collection';
  
  if (oldPrice) {
    document.getElementById('qvPrice').innerHTML = `₹${price.toLocaleString('en-IN')} <span style="text-decoration: line-through; color: var(--text-muted); font-size: 1rem; margin-left: 0.5rem;">₹${oldPrice}</span>`;
  } else {
    document.getElementById('qvPrice').innerText = `₹${price.toLocaleString('en-IN')}`;
  }
  
  // Set image background
  const imgEl = document.getElementById('qvImage');
  imgEl.className = 'qv-image-side';
  if (imageClass) imgEl.classList.add(imageClass);
  
  if (imageUrl) {
    imgEl.style.backgroundImage = `url('${imageUrl}')`;
  } else {
    imgEl.style.backgroundImage = '';
  }
  // Update buttons
  const addBtn = document.getElementById('qvAddToCartBtn');
  addBtn.onclick = function() {
    addToCart(name, price);
    closeQuickView();
  };
  
  const wishBtn = document.getElementById('qvWishlistBtn');
  const inWishlist = wishlist.some(item => item.name === name);
  wishBtn.innerHTML = inWishlist ? '♥ Remove from Wishlist' : '♡ Add to Wishlist';
  wishBtn.onclick = function() {
    toggleWishlist(name, price, imageClass);
    closeQuickView();
  };
  
  document.getElementById('qvOverlay').classList.add('active');
};

window.closeQuickView = function(e) {
  if (e && e.target !== document.getElementById('qvOverlay')) return;
  document.getElementById('qvOverlay').classList.remove('active');
};

window.toggleWishlist = function(name, price, imageClass) {
  const index = wishlist.findIndex(item => item.name === name);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast(`${name} removed from wishlist!`);
  } else {
    wishlist.push({ name, price, imageClass, addedAt: new Date().toISOString() });
    showToast(`♥ ${name} added to wishlist!`);
  }
  window.safeStorage.setItem(window.getWishlistKey(), JSON.stringify(wishlist));
  // Re-render if sidebar is open
  if (document.getElementById('wishlistSidebar') && document.getElementById('wishlistSidebar').classList.contains('active')) {
    renderWishlistSidebar();
  }
};

/* ============================================================
   HERO CAROUSEL LOGIC
   ============================================================ */
window.heroCarouselItems = [
  { name: 'Banarasi Silk<br>Zari Saree', priceNum: 8499, price: '₹8,499', oldPrice: '₹12,000', tag: 'Featured · Saree Collection', img: 'img-saree' },
  { name: 'Embroidered<br>Bridal Lehenga', priceNum: 14999, price: '₹14,999', oldPrice: '₹21,000', tag: 'Featured · Lehenga', img: 'img-lehenga' },
  { name: 'Floral<br>Maxi Dress', priceNum: 3299, price: '₹3,299', oldPrice: null, tag: 'Trending · Evening Wear', img: 'img-gown' },
  { name: 'Royal Gold-Work<br>Sherwani', priceNum: 18999, price: '₹18,999', oldPrice: '₹25,000', tag: 'Premium · Mens', img: 'img-sherwani' },
  { name: 'Oxford<br>Cotton Shirt', priceNum: 1899, price: '₹1,899', oldPrice: null, tag: 'New · Formal Shirts', img: 'img-shirt' }
];
window.currentHeroIndex = 0;

function initHeroCarousel() {
  const track = document.getElementById('heroTrack');
  if (track && window.heroCarouselItems && window.heroCarouselItems.length > 0) {
    track.style.width = (window.heroCarouselItems.length * 100) + '%';
    track.innerHTML = window.heroCarouselItems.map(item => `
      <div style="flex: 0 0 ${100 / window.heroCarouselItems.length}%; position: relative; height: 100%;">
        <div class="model-img ${item.img || ''}" ${item.imageUrl ? `style="background-image: url('${item.imageUrl}'); background-size: cover; background-position: top center;"` : ''}></div>
        <div class="hero-model-info">
          <div class="hero-product-tag">${item.tag}</div>
          <div class="hero-product-name">${item.name}</div>
          <div class="hero-product-price">${item.price}${item.oldPrice ? ` <span class="hero-price-old">${item.oldPrice}</span>` : ''}</div>
        </div>
      </div>
    `).join('');
  }
}

function rotateHeroCarousel() {
  const track = document.getElementById('heroTrack');
  if (!track || !window.heroCarouselItems || window.heroCarouselItems.length === 0) return;
  
  window.currentHeroIndex = (window.currentHeroIndex + 1) % window.heroCarouselItems.length;
  track.style.transform = `translateX(-${window.currentHeroIndex * (100 / window.heroCarouselItems.length)}%)`;
}

// Rotate every 2 seconds
setInterval(rotateHeroCarousel, 2000);

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", initHeroCarousel);

window.toggleWishlistSidebar = function() {
  const overlay = document.getElementById('wishlistOverlay');
  const sidebar = document.getElementById('wishlistSidebar');
  
  if (sidebar.classList.contains('active')) {
    overlay.classList.remove('active');
    sidebar.classList.remove('active');
  } else {
    renderWishlistSidebar();
    overlay.classList.add('active');
    sidebar.classList.add('active');
  }
};

window.renderWishlistSidebar = function() {
  const container = document.getElementById('wishlistItemsContainer');
  if (!container) return;
  
  if (wishlist.length === 0) {
    container.innerHTML = '<div class="cart-empty">Your wishlist is empty.</div>';
    return;
  }
  
  container.innerHTML = wishlist.map((item, index) => `
    <div class="cart-item" style="display: flex; gap: 1rem; align-items: center;">
      <div class="${item.imageClass}" style="width: 60px; height: 80px; background-size: cover; background-position: center; border-radius: 4px; flex-shrink: 0;"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
        <div style="margin-top: 0.5rem; display: flex; gap: 1rem;">
          <a href="#" style="color: var(--text-muted); font-size: 0.8rem;" onclick="event.preventDefault(); removeFromWishlist(${index})">Remove</a>
          <a href="#" style="color: var(--gold-primary); font-size: 0.8rem;" onclick="event.preventDefault(); addToCart('${item.name}', ${item.price}); removeFromWishlist(${index});">Move to Cart</a>
        </div>
      </div>
    </div>
  `).join('');
};

window.removeFromWishlist = function(index) {
  wishlist.splice(index, 1);
  window.safeStorage.setItem(window.getWishlistKey(), JSON.stringify(wishlist));
  renderWishlistSidebar();
};

/* ============================================================
   SEARCH LOGIC
   ============================================================ */
window.toggleSearch = function() {
  const overlay = document.getElementById('searchOverlay');
  if (overlay.classList.contains('active')) {
    overlay.classList.remove('active');
  } else {
    overlay.classList.add('active');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchInput').focus();
    
    // Build search index if not built
    if (!window.allSearchProducts) {
      window.allSearchProducts = [...window.heroCarouselItems];
      const pcards = document.querySelectorAll('.pcard');
      pcards.forEach(card => {
        const btn = card.querySelector('.pcard-btn-add');
        if (!btn) return;
        const match = btn.getAttribute('onclick').match(/addToCart\('([^']+)',\s*(\d+)\)/);
        if (match) {
          const name = match[1];
          const priceNum = parseInt(match[2]);
          const imgEl = card.querySelector('.pcard-bg');
          const imgClass = imgEl ? Array.from(imgEl.classList).find(c => c.startsWith('img-')) : '';
          const tagEl = card.querySelector('.pcard-tag');
          const tag = tagEl ? tagEl.innerText : '';
          const oldPriceEl = card.querySelector('.pcard-price-old');
          const oldPrice = oldPriceEl ? oldPriceEl.innerText : null;
          
          if (!window.allSearchProducts.find(p => p.name.replace('<br>', ' ') === name.replace('<br>', ' '))) {
            window.allSearchProducts.push({ name, priceNum, price: '₹' + priceNum.toLocaleString('en-IN'), img: imgClass, tag, oldPrice });
          }
        }
      });
    }
  }
};

window.handleSearch = function(query) {
  const resultsContainer = document.getElementById('searchResults');
  if (!query || query.length < 2) {
    resultsContainer.innerHTML = '';
    return;
  }
  
  const q = query.toLowerCase();
  const results = window.allSearchProducts.filter(p => 
    p.name.toLowerCase().includes(q) || 
    (p.tag && p.tag.toLowerCase().includes(q))
  );
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">No products found for "' + query + '"</div>';
    return;
  }
  
  resultsContainer.innerHTML = results.map(item => `
    <div class="search-result-item" onclick="toggleSearch(); openQuickView('${item.name.replace('<br>', ' ')}', ${item.priceNum}, '${item.img}', '${item.oldPrice ? item.oldPrice.replace('₹','') : null}', '${item.tag}');">
      <div class="search-result-img ${item.img}"></div>
      <div>
        <div style="font-size: 0.8rem; color: var(--gold-primary); margin-bottom: 0.2rem;">${item.tag}</div>
        <div style="font-size: 1.1rem; color: var(--text-light);">${item.name}</div>
        <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.3rem;">${item.price}</div>
      </div>
    </div>
  `).join('');
};

// Initialize Cart counter on load
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('navCartBtn').innerText = `Cart (${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
});

// Load home page products dynamically
async function loadHomeProducts() {
  const wGrid = document.getElementById('women-grid');
  const mGrid = document.querySelector('.product-grid.men-grid');
  
  if (!wGrid && !mGrid) return; // not on home page

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    const products = await res.json();
    
    if (wGrid) wGrid.innerHTML = '';
    if (mGrid) mGrid.innerHTML = '';

    products.forEach((prod, index) => {
      // Determine if it belongs to Men's based on name/category/tag
      const isMen = /(men|kurta|sherwani|nehru|shirt)/i.test(prod.name) && !/(women|saree|lehenga|anarkali|sharara|dress)/i.test(prod.name);
      
      const grid = isMen ? mGrid : wGrid;
      if (!grid) return;

      const oldPrice = Math.round(prod.price * 1.3); // Fake old price for UI
      let finalImgUrl = prod.image_url;
      if (finalImgUrl && finalImgUrl.startsWith('assets/uploads/')) {
        finalImgUrl = '/' + finalImgUrl;
      }
      const imageStyle = finalImgUrl ? `background-image: url('${finalImgUrl}');` : `background: #374151;`;
      
      // Every 5th item can be tall
      const isTall = index % 5 === 0 ? 'tall' : '';
      
      const cardHtml = `
        <div class="pcard ${isTall} tilt-card">
          <div class="pcard-bg" style="${imageStyle} background-size: cover; background-position: center; min-height: ${isTall ? '520px' : '380px'}; cursor: pointer;" onclick="openQuickView('${prod.name.replace(/'/g, "\\'")}', ${prod.price}, '', '${oldPrice}', 'Collection', '${finalImgUrl || ''}')"></div>
          <div class="pcard-overlay"></div>
          <div class="pcard-gloss"></div>
          <div class="badge-new">New In</div>
          
          <button class="pcard-btn" onclick="event.stopPropagation(); addToCart('${prod.name.replace(/'/g, "\\'")}', ${prod.price})">+</button>
          <div class="pcard-actions">
            <button class="pcard-btn-add" onclick="addToCart('${prod.name.replace(/'/g, "\\'")}', ${prod.price})">Add to Cart</button>
            <button class="pcard-btn-buy" onclick="buyNow('${prod.name.replace(/'/g, "\\'")}', ${prod.price})">Buy Now</button>
          </div>
          <div class="pcard-info" style="cursor: pointer;" onclick="openQuickView('${prod.name.replace(/'/g, "\\'")}', ${prod.price}, '', '${oldPrice}', 'Collection', '${finalImgUrl || ''}')">
            <div class="pcard-tag">Collection</div>
            <div class="pcard-name" style="font-size: 1.1rem; line-height: 1.4;">${prod.name}</div>
            <div class="pcard-price">₹${prod.price} <span class="pcard-price-old">₹${oldPrice}</span></div>
          </div>
        </div>
      `;
      grid.innerHTML += cardHtml;
    });
    
    // Re-initialize tilt effect for new cards if Tilt.js function exists
    if (typeof VanillaTilt !== 'undefined') {
      VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
        max: 8,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
      });
    }

    // Update Hero Carousel with dynamic products (prioritize sarees)
    const sareeProducts = products.filter(p => /saree/i.test(p.name));
    const carouselProducts = [...sareeProducts, ...products].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i).slice(0, 15);
    
    if (carouselProducts.length > 0) {
      window.heroCarouselItems = carouselProducts.map(p => {
        const oldPrice = Math.round(p.price * 1.3);
        let finalImgUrl = p.image_url;
        if (finalImgUrl && finalImgUrl.startsWith('assets/uploads/')) {
          finalImgUrl = '/' + finalImgUrl;
        }
        return {
          name: p.name,
          priceNum: p.price,
          price: '₹' + p.price,
          oldPrice: '₹' + oldPrice,
          tag: 'Featured Collection',
          img: '',
          imageUrl: finalImgUrl
        };
      });
      initHeroCarousel(); // Re-render the carousel
    }
  } catch (err) {
    console.error('Error loading home products:', err);
  }
}

document.addEventListener("DOMContentLoaded", loadHomeProducts);
