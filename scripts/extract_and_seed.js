const { pool } = require('../src/config/database');
const fs = require('fs');

async function extractAndSeed() {
  const html = fs.readFileSync('website/index.html', 'utf8');
  const css = fs.readFileSync('website/style.css', 'utf8');
  
  // Parse CSS for class to image mapping
  const classToImg = {};
  const cssRegex = /\.img-[a-zA-Z0-9-]+\s*\{[^}]*background[^}]*url\(['"]?([^'"]+)['"]?\)/g;
  let cssMatch;
  while ((cssMatch = cssRegex.exec(css)) !== null) {
    const className = cssMatch[0].match(/\.img-[a-zA-Z0-9-]+/)[0].substring(1);
    classToImg[className] = cssMatch[1];
  }

  const products = [];
  let idx = 0;
  
  // Parse HTML
  while(true) {
    const nameIdx = html.indexOf('class="pcard-name">', idx);
    if(nameIdx === -1) break;
    
    const endName = html.indexOf('</div>', nameIdx);
    const nameHTML = html.substring(nameIdx + 19, endName);
    const name = nameHTML.replace(/<br>/g, ' ').trim();
    
    const priceIdx = html.indexOf('class="pcard-price">', endName);
    const endPrice = html.indexOf('</div>', priceIdx);
    const priceMatch = html.substring(priceIdx + 20, endPrice).match(/₹([0-9,]+)/);
    if (!priceMatch) {
      idx = endPrice;
      continue;
    }
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    
    // Find background or image
    const cardStart = html.lastIndexOf('class="pcard tilt-card', nameIdx);
    const imgLineStart = html.indexOf('class="pcard-bg', cardStart);
    const imgLineEnd = html.indexOf('>', imgLineStart);
    const imgLine = html.substring(imgLineStart, imgLineEnd);
    
    let imgUrl = '';
    const urlMatch = imgLine.match(/url\(['"]?([^'"]+)['"]?\)/);
    if(urlMatch) {
      imgUrl = urlMatch[1];
    } else {
      // try to get from onclick
      const onclickMatch = imgLine.match(/openQuickView\([^,]+,\s*[0-9]+,\s*['"]([^'"]+)['"](?:,\s*[^,]+,\s*[^,]+,\s*['"]([^'"]+)['"])?/);
      if(onclickMatch) {
        if (onclickMatch[2]) {
          imgUrl = onclickMatch[2]; // If 6th arg is present (image URL)
        } else {
          // It is a css class, e.g. img-saree
          imgUrl = onclickMatch[1];
        }
      }
    }
    
    products.push({name, price, imgUrl});
    idx = endPrice;
  }
  
  // Also get tcard (trending cards)
  idx = 0;
  while(true) {
    const nameIdx = html.indexOf('class="tcard-name">', idx);
    if(nameIdx === -1) break;
    
    const endName = html.indexOf('</div>', nameIdx);
    const name = html.substring(nameIdx + 20, endName).replace(/<br>/g, ' ').trim();
    
    const priceIdx = html.indexOf('class="tcard-price">', endName);
    const endPrice = html.indexOf('</div>', priceIdx);
    const priceMatch = html.substring(priceIdx + 20, endPrice).match(/₹([0-9,]+)/);
    if (!priceMatch) {
      idx = endPrice;
      continue;
    }
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    
    const cardStart = html.lastIndexOf('class="tcard"', nameIdx);
    const imgLineStart = html.indexOf('class="tcard-img', cardStart);
    const imgLineEnd = html.indexOf('>', imgLineStart);
    const imgLine = html.substring(imgLineStart, imgLineEnd);
    
    let imgUrl = '';
    const urlMatch = imgLine.match(/url\(['"]?([^'"]+)['"]?\)/);
    if(urlMatch) imgUrl = urlMatch[1];
    else {
        const onclickMatch = imgLine.match(/openQuickView\([^,]+,\s*[0-9]+,\s*['"]([^'"]+)['"]/);
        if(onclickMatch) imgUrl = onclickMatch[1];
    }
    
    products.push({name, price, imgUrl});
    idx = endPrice;
  }
  
  try {
    // Delete existing mocked ones
    await pool.query('DELETE FROM products');
    console.log('Cleared existing products');

    for (let p of products) {
      // Resolve CSS class to actual image URL if necessary
      if (classToImg[p.imgUrl]) {
        p.imgUrl = classToImg[p.imgUrl];
      }
      
      const cost = Math.floor(p.price * 0.7); // 30% margin
      const stock = Math.floor(Math.random() * 100) + 10;
      
      await pool.query(
        'INSERT INTO products (name, description, price, cost_price, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
        [p.name, 'Vasudha Couture Collection', p.price, cost, stock, p.imgUrl]
      );
    }
    console.log(`Successfully seeded ${products.length} exact products with correct real images.`);
  } catch (err) {
    console.error('Error seeding DB:', err);
  } finally {
    process.exit(0);
  }
}

extractAndSeed();
