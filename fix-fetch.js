const fs = require('fs');

const jsFiles = ['website/script.js', 'website/dashboard.js'];

jsFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace fetch('/api/... or fetch('/auth/... with API_URL
  content = content.replace(/fetch\('(\/api\/|\/auth\/)([^']+)'/g, "fetch('http://localhost:3000$1$2'");
  
  // For the dynamic endpoint in script.js: fetch(endpoint
  content = content.replace(
    /const endpoint = isSignup \? '\/auth\/register' : '\/auth\/login';/,
    "const endpoint = 'http://localhost:3000' + (isSignup ? '/auth/register' : '/auth/login');"
  );
  
  fs.writeFileSync(f, content);
  console.log(`Updated fetch URLs in ${f}`);
});
