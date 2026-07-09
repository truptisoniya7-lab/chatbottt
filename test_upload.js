const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const req = http.request('http://localhost:3000/api/upload/product-image', {
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response Status:', res.statusCode, '\nResponse Body:', data));
});

req.write(`--${boundary}\r\n`);
req.write('Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n');
req.write('Content-Type: image/jpeg\r\n\r\n');
req.write('fake image data\r\n');
req.write(`--${boundary}--\r\n`);
req.end();
