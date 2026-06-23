const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for simple development; in prod we configure properly
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', // Allow all by default for dev
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static frontend and widget from root directory
app.use(express.static(path.join(__dirname, '../website')));
app.use(express.static(path.join(__dirname, '../widget')));

// Basic health check
app.get('/chat/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vaani AI Chatbot API is running' });
});

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
