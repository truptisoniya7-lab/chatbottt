const fs = require('fs');
let data = JSON.parse(fs.readFileSync('website/catalog.json', 'utf8'));

const imageMap = {
  'VC-W-011': 'assets/womens_kurti_distinct.png',
  'VC-W-012': 'assets/womens_top_distinct.png',
  'VC-W-013': 'assets/silk_blend_tunic.png',
  'VC-W-014': 'assets/floral_rayon_kurti.png',
  'VC-W-015': 'assets/chanderi_silk_crop.png',
  'VC-W-016': 'assets/peplum_top.png',
  'VC-W-017': 'assets/zari_kurti_set.png',
  'VC-M-011': 'assets/mens_shirt_distinct.png',
  'VC-M-012': 'assets/kurta_model_1782372108155.png', // The default green kurta
  'VC-M-013': 'assets/mens_jeans_distinct.png',
  'VC-M-014': 'assets/printed_short_kurta.png',
  'VC-M-015': 'assets/polo_tshirt.png'
};

if (data.products_women) {
  data.products_women.forEach(p => {
    if (imageMap[p.product_id]) p.image_url = imageMap[p.product_id];
  });
}
if (data.products_men) {
  data.products_men.forEach(p => {
    if (imageMap[p.product_id]) p.image_url = imageMap[p.product_id];
  });
}

const jsonStr = JSON.stringify(data, null, 2);
fs.writeFileSync('website/catalog.json', jsonStr);
fs.writeFileSync('src/data/modules/catalog.json', jsonStr);
fs.writeFileSync('website/catalog.js', 'window.PRODUCT_CATALOG = ' + jsonStr + ';');
