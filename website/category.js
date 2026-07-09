document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type') || 'all';
  const genderParam = urlParams.get('gender');
  
  // Update header title
  const titleMap = {
    'lehengas': 'Shop Lehengas',
    'sarees': 'Saree Collection',
    'kurtas': 'Designer Kurtas',
    'jeans': 'Jeans & Trousers',
    'women': 'Women\'s Collection',
    'men': 'Men\'s Collection',
    'all': 'All Categories'
  };
  
  document.getElementById('categoryTitle').innerText = titleMap[typeParam.toLowerCase()] || `Shop ${typeParam}`;
  
  // Fetch products
  fetchProducts(typeParam, genderParam);
});

async function fetchProducts(categoryType, genderParam = null) {
  const grid = document.getElementById('categoryGrid');
  
  try {
    let products = [];
    if (window.PRODUCT_CATALOG) {
      if (window.PRODUCT_CATALOG.products_women) products = products.concat(window.PRODUCT_CATALOG.products_women);
      if (window.PRODUCT_CATALOG.products_men) products = products.concat(window.PRODUCT_CATALOG.products_men);
      if (window.PRODUCT_CATALOG.ethnic_heritage) products = products.concat(window.PRODUCT_CATALOG.ethnic_heritage);
    }
    
    // Fetch products from backend database
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const dbProducts = await res.json();
        
        dbProducts.forEach(p => {
          // Skip if already in the catalog (prevent duplicates)
          if (products.some(existing => existing.name === p.name)) return;
          
          const nameLower = (p.name || '').toLowerCase();
          
          // Infer category
          let inferredCat = p.category || '';
          if (!inferredCat) {
            if (nameLower.includes('lehenga')) inferredCat = 'lehengas';
            else if (nameLower.includes('saree')) inferredCat = 'sarees';
            else if (nameLower.includes('kurti') || nameLower.includes('kurta')) inferredCat = 'kurtas';
            else if (nameLower.includes('shirt')) inferredCat = 'shirts';
            else if (nameLower.includes('jean') || nameLower.includes('trouser')) inferredCat = 'jeans';
          }
          
          // Infer gender
          let inferredGender = 'unisex';
          if (p.category && p.category.toLowerCase().includes('men')) inferredGender = 'men';
          else if (p.category && p.category.toLowerCase().includes('women')) inferredGender = 'women';
          else if (nameLower.includes('women') || nameLower.includes('lehenga') || nameLower.includes('saree') || nameLower.includes('kurti') || nameLower.includes('anarkali') || nameLower.includes('palazzo') || nameLower.includes('dress')) inferredGender = 'women';
          else if (nameLower.includes('men') || nameLower.includes('sherwani') || nameLower.includes('blazer') || nameLower.includes('shirt')) inferredGender = 'men';
          
          products.push({
            id: p.id,
            name: p.name,
            category: inferredCat,
            gender: inferredGender,
            price: parseFloat(p.price),
            image_url: p.image_url || 'https://via.placeholder.com/300x400?text=No+Image',
            description: p.description
          });
        });
      }
    } catch (e) {
      console.warn('Could not fetch products from backend:', e);
    }
    
    if (categoryType !== 'all') {
      const targetCat = categoryType.toLowerCase();
      products = products.filter(p => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const pGender = (p.gender || '').toLowerCase();
        
        // Exclude if genderParam is explicitly provided and doesn't match product gender
        if (genderParam) {
          const targetGender = genderParam.toLowerCase();
          // We assume "unisex" fits both, otherwise it must match targetGender exactly
          if (pGender && pGender !== targetGender && !pGender.includes('unisex') && !pGender.includes('both')) {
            return false;
          }
        }
        
        if (targetCat === 'women' && (cat.includes('women') || pGender === 'women')) return true;
        if (targetCat === 'men' && (cat.includes('men') || pGender === 'men')) return true;
        if (targetCat === 'lehengas' && (cat.includes('lehenga') || name.includes('lehenga'))) return true;
        if (targetCat === 'sarees' && (cat.includes('saree') || name.includes('saree'))) return true;
        if (targetCat === 'kurtas' && (cat.includes('kurta') || name.includes('kurta') || cat.includes('kurti') || name.includes('kurti'))) return true;
        if ((targetCat === 'tops' || targetCat === 'top') && (cat.includes('top') || name.includes('top'))) return true;
        if (targetCat === 'jeans' && (cat.includes('jean') || name.includes('jean') || cat.includes('trouser'))) return true;
        
        return cat.includes(targetCat) || name.includes(targetCat);
      });
    }
    
    if (products.length === 0) {
      grid.innerHTML = '<div class="no-products">No products found in this category.</div>';
      return;
    }
    
    renderProducts(products, grid);
  } catch (error) {
    console.error('Error loading products:', error);
    grid.innerHTML = '<div class="no-products">Failed to load products. Please try again later.</div>';
  }
}

function renderProducts(products, grid) {
  grid.innerHTML = '';
  
  products.forEach(product => {
    // Determine image class based on category, name, and gender
    let imgClass = 'img-ethnic'; // default
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const gender = (product.gender || '').toLowerCase();
    
    if (gender === 'men' || cat.includes('men') || name.includes('men')) {
      if (cat.includes('shirt') || name.includes('shirt')) imgClass = 'img-shirt';
      else if (cat.includes('jean') || name.includes('jean') || cat.includes('denim')) imgClass = 'img-jeans';
      else if (cat.includes('sherwani') || name.includes('sherwani')) imgClass = 'img-sherwani';
      else if (cat.includes('blazer') || name.includes('blazer') || cat.includes('suit')) imgClass = 'img-blazer';
      else imgClass = 'img-kurta-men'; // default men's ethnic
    } else {
      // Women's default logic
      if (cat.includes('lehenga') || name.includes('lehenga')) imgClass = 'img-lehenga';
      else if (cat.includes('saree') || name.includes('saree')) imgClass = 'img-saree';
      else if (cat.includes('gown') || name.includes('gown') || name.includes('dress')) imgClass = 'img-gown';
      else if (cat.includes('anarkali') || name.includes('anarkali')) imgClass = 'img-anarkali';
      else if (cat.includes('jean') || name.includes('jean') || cat.includes('trouser')) imgClass = 'img-jeans';
      else if (cat.includes('top') || name.includes('top')) imgClass = 'img-top'; // use distinct top image
      else if (cat.includes('kurta') || name.includes('kurta') || cat.includes('kurti') || name.includes('kurti')) imgClass = 'img-kurti'; // use distinct kurti image
      else imgClass = 'img-anarkali'; // default women's ethnic
    }
    
    const formattedPrice = product.price ? product.price.toLocaleString('en-IN') : '0';
    // Access data JSONB fields if necessary, some fields might be top level depending on schema
    const mrp = product.data && product.data.mrp ? product.data.mrp : null;
    let oldPriceHtml = '';
    if (mrp && mrp > product.price) {
      oldPriceHtml = `<span class="pcard-price-old">₹${mrp.toLocaleString('en-IN')}</span>`;
    }

    const card = document.createElement('div');
    card.className = 'pcard tilt-card';
    card.innerHTML = `
      <div class="pcard-bg ${imgClass}" style="min-height:300px; cursor: pointer; ${product.image_url ? `background: url('${product.image_url}') center/cover;` : ''}" onclick="openQuickView('${product.name}', ${product.price}, '${imgClass}', '${mrp ? mrp.toLocaleString('en-IN') : ''}', '${product.category || 'Category'}', '${product.image_url || ''}')"></div>
      <div class="pcard-overlay"></div>
      <div class="pcard-gloss"></div>
      <button class="pcard-btn" onclick="event.stopPropagation(); addToCart('${product.name}', ${product.price})">+</button>
      <div class="pcard-actions">
        <button class="pcard-btn-add" onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
        <button class="pcard-btn-buy" onclick="buyNow('${product.name}', ${product.price})">Buy Now</button>
      </div>
      <div class="pcard-info" style="cursor: pointer;" onclick="openQuickView('${product.name}', ${product.price}, '${imgClass}', '${mrp ? mrp.toLocaleString('en-IN') : ''}', '${product.category || 'Category'}', '${product.image_url || ''}')">
        <div class="pcard-tag" style="text-transform: capitalize;">${product.category || 'Apparel'}</div>
        <div class="pcard-name">${product.name}</div>
        <div class="pcard-price">₹${formattedPrice} ${oldPriceHtml}</div>
      </div>
    `;
    
    grid.appendChild(card);
  });
}
