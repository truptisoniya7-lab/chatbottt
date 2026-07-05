const fs = require('fs');
const path = require('path');
const websiteDir = 'website';
const files = fs.readdirSync(websiteDir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const filePath = path.join(websiteDir, f);
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('favicon.png')) {
    html = html.replace('</head>', '  <link rel="icon" type="image/png" href="/assets/favicon.png?v=1">\n</head>');
    fs.writeFileSync(filePath, html);
    console.log(`Added favicon to ${f}`);
  }
});
