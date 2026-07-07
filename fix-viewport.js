const fs = require('fs');
const files = [
  'website/index.html',
  'website/category.html',
  'website/dashboard-user.html',
  'website/dashboard-admin.html',
  'website/dashboard-seller.html'
];

files.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  // Replace standard mobile responsive viewport with a fixed desktop viewport
  html = html.replace(
    /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/g,
    '<meta name="viewport" content="width=1280">'
  );
  fs.writeFileSync(f, html);
  console.log(`Updated viewport in ${f}`);
});
