const fs = require('fs');
const files = [
  'website/index.html',
  'website/category.html',
  'website/dashboard-user.html',
  'website/dashboard-admin.html',
  'website/dashboard-seller.html'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let html = fs.readFileSync(f, 'utf8');
    // Revert fixed desktop viewport to standard mobile responsive viewport
    html = html.replace(
      /<meta name="viewport" content="width=1280">/g,
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    );
    fs.writeFileSync(f, html);
    console.log(`Updated viewport to mobile responsive in ${f}`);
  }
});
