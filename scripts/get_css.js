const fs = require('fs');
const css = fs.readFileSync('website/style.css', 'utf8');
const regex = /\.img-[a-zA-Z0-9-]+\s*\{[^}]*background[^}]*url\(['"]?([^'"]+)['"]?\)/g;
let match;
while ((match = regex.exec(css)) !== null) {
  console.log(match[0].match(/\.img-[a-zA-Z0-9-]+/)[0], '=>', match[1]);
}
