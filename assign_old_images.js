const fs = require('fs');
let data = JSON.parse(fs.readFileSync('website/catalog.json', 'utf8'));

const imageMap = {
  // Old Women's
  'VC-W-001': 'assets/saree_model_1782371974758.png',
  'VC-W-008': 'assets/saree_chanderi.png',
  'VC-W-009': 'assets/saree_georgette.png',
  'VC-W-010': 'assets/saree_kalamkari.png',
  'VC-W-002': 'assets/lehenga_model_1782371986363.png',
  'VC-W-003': 'assets/floral_maxi_dress.png',
  'VC-W-004': 'assets/anarkali_suit.png',
  'VC-W-005': 'assets/womens_dress_model_1782379530104.png',
  'VC-W-006': 'assets/dupatta.png',
  'VC-W-007': 'assets/palazzo.png',
  
  // Old Men's
  'VC-M-001': 'assets/sherwani_model_1782372003018.png',
  'VC-M-002': 'assets/mens_shirt_model_1782378349323.png',
  'VC-M-003': 'assets/kurta_model_1782372108155.png', // The default green kurta
  'VC-M-004': 'assets/mens_jeans_model_1782378330701.png',
  'VC-M-005': 'assets/nehru.png', // Tweed Blazer
  
  // Ethnic Heritage
  'VC-E-001': 'assets/categories/kurta.png',
  'VC-E-002': 'assets/dhoti.png',
  'VC-E-003': 'assets/categories/dress.png',
  'VC-E-004': 'assets/sherwani_model_1782372003018.png'
};

const mapProducts = (arr) => {
  if (!arr) return;
  arr.forEach(p => {
    if (imageMap[p.product_id]) {
      p.image_url = imageMap[p.product_id];
    }
  });
};

mapProducts(data.products_women);
mapProducts(data.products_men);
mapProducts(data.ethnic_heritage);

const jsonStr = JSON.stringify(data, null, 2);
fs.writeFileSync('website/catalog.json', jsonStr);
fs.writeFileSync('src/data/modules/catalog.json', jsonStr);
fs.writeFileSync('website/catalog.js', 'window.PRODUCT_CATALOG = ' + jsonStr + ';');
