const fs = require('fs');
let html = fs.readFileSync('website/index.html', 'utf8');

const regex = /<button class="pcard-btn"[^>]*>\+<\/button>\s*<div class="pcard-info">\s*<div class="pcard-tag">[^<]+<\/div>\s*<div class="pcard-name">([\s\S]+?)<\/div>\s*<div class="pcard-price">₹([0-9,]+)/g;

html = html.replace(regex, (match, rawName, rawPrice) => {
  let name = rawName.replace(/<br>/g, ' ').trim();
  let price = parseInt(rawPrice.replace(/,/g, ''), 10);
  
  let newActions = `
      <div class="pcard-actions">
        <button class="pcard-btn-add" onclick="addToCart('${name}', ${price})">Add to Cart</button>
        <button class="pcard-btn-buy" onclick="buyNow('${name}', ${price})">Buy Now</button>
      </div>`;
      
  let result = match.replace(/<button class="pcard-btn"[^>]*>\+<\/button>/, newActions);
  return result;
});

fs.writeFileSync('website/index.html', html);
console.log('Successfully updated index.html');
