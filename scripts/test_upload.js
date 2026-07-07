const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MTNhZTY2MS1jYzkzLTQ1OWItOGQyYy0zMGY0NGE1ZDgzNzQiLCJpYXQiOjE3ODM0MjIyMjV9.0fUjKKwruHcnhYH4KybtOtn7ysIHTkxp0RSpa_ZmW3I";

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n';
body += 'Content-Type: image/jpeg\r\n\r\n';
body += 'fake image data\r\n';
body += '--' + boundary + '--\r\n';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload/product-image',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data));
});
req.on('error', console.error);
req.write(body);
req.end();
