const fs = require('fs');

function replaceInFiles() {
  const files = [
    'website/category.html',
    'website/dashboard-admin.html',
    'website/dashboard.js',
    'website/index.html',
    'website/script.js'
  ];

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/http:\/\/localhost:3000/g, '');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  });
}
replaceInFiles();
