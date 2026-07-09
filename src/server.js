const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = parseInt(process.env.PORT || 3000, 10);

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1 || (origin && origin.endsWith('vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Serve static frontend and widget from root directory
app.use(express.static(path.join(__dirname, '../website')));
app.use(express.static(path.join(__dirname, '../widget')));

// Basic health check
app.get('/chat/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vaani AI Chatbot API is running' });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat');
const ecommerceRoutes = require('./routes/ecommerce.routes');
const uploadRoutes = require('./routes/upload.routes');

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/api', ecommerceRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const http = require('http');
const server = http.createServer(app);

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using port ${PORT} and try again.`);
    process.exit(1);
  } else {
    console.error('Server error:', e);
    process.exit(1);
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${server.address().port}`);
  });
}

module.exports = app;
