const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Testing Tool Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Basic proxy endpoint (will be enhanced later)
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;
    
    // For now, just return a mock response
    res.json({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: { message: 'Proxy endpoint ready - implementation in progress' },
      duration: 0
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      duration: 0
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});