const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route imports
const healthRoutes = require('./routes/health');
const historyRoutes = require('./routes/history');
const collectionsRoutes = require('./routes/collections');
const proxyRoutes = require('./routes/proxy');

// Middleware imports
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Supabase init (runs on import)
const supabase = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/proxy', proxyRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use('*', notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/api/proxy`);
  console.log(`📝 History endpoint: http://localhost:${PORT}/api/history`);
  console.log(`🗂️ Collections endpoint: http://localhost:${PORT}/api/collections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${supabase }`);
});
