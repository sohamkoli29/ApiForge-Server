const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Testing Tool Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// History endpoints
app.post('/api/history/save', async (req, res) => {
  try {
    const { userId, url, method, headers, params, body, responseStatus, duration } = req.body;

    // For now, we'll just return success since we'll implement Convex client later
    // In a real implementation, you'd call Convex mutation here
    res.json({
      success: true,
      message: 'History saved (Convex integration pending)',
      data: {
        userId,
        url,
        method,
        responseStatus,
        duration
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save history',
      message: error.message
    });
  }
});

app.get('/api/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // For now, return mock data
    // In real implementation, call Convex query
    res.json({
      success: true,
      data: [],
      message: 'History retrieval (Convex integration pending)'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

// Proxy endpoint (existing code remains the same)
app.post('/api/proxy', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { url, method, headers, body, timeout = 30000 } = req.body;

    // Validate required fields
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        duration: Date.now() - startTime
      });
    }

    if (!method) {
      return res.status(400).json({
        error: 'HTTP method is required',
        duration: Date.now() - startTime
      });
    }

    // Validate URL format
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format',
        duration: Date.now() - startTime
      });
    }

    // Security: Block requests to localhost/internal networks in production
    if (process.env.NODE_ENV === 'production') {
      const blockedHosts = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
        '10.',
        '192.168.',
        '172.16.',
        '172.17.',
        '172.18.',
        '172.19.',
        '172.20.',
        '172.21.',
        '172.22.',
        '172.23.',
        '172.24.',
        '172.25.',
        '172.26.',
        '172.27.',
        '172.28.',
        '172.29.',
        '172.30.',
        '172.31.'
      ];

      const hostname = targetUrl.hostname;
      if (blockedHosts.some(blocked => hostname.startsWith(blocked))) {
        return res.status(403).json({
          error: 'Requests to localhost or internal networks are not allowed in production',
          duration: Date.now() - startTime
        });
      }
    }

    // Prepare request configuration
    const config = {
      method: method.toLowerCase(),
      url: targetUrl.toString(),
      timeout: parseInt(timeout),
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      },
      maxRedirects: 0,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
    };

    // Set headers
    if (headers && typeof headers === 'object') {
      config.headers = { ...headers };
      
      const disallowedHeaders = [
        'host',
        'origin',
        'referer',
        'user-agent',
        'accept-encoding',
        'connection',
        'content-length'
      ];
      
      disallowedHeaders.forEach(header => {
        delete config.headers[header];
      });

      if (!config.headers['user-agent']) {
        config.headers['user-agent'] = 'APITestingTool/1.0.0';
      }
    }

    // Set request body for applicable methods
    if (['post', 'put', 'patch', 'delete'].includes(method.toLowerCase()) && body) {
      config.data = body;
    }

    console.log(`Proxying ${method} request to: ${url}`);

    // Make the request
    const response = await axios(config);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Prepare response data
    let responseData;
    const contentType = response.headers['content-type'] || '';

    try {
      if (contentType.includes('application/json') && typeof response.data === 'string') {
        responseData = JSON.parse(response.data);
      } else if (typeof response.data === 'object') {
        responseData = response.data;
      } else {
        responseData = response.data;
      }
    } catch (parseError) {
      responseData = response.data;
    }

    // Return the proxied response
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: responseData,
      duration: duration,
      size: JSON.stringify(response.data).length,
      redirected: response.request?.res?.responseUrl !== url
    });

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('Proxy error:', error.message);

    // Handle different types of errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Connection refused - the server may be down or the URL may be incorrect',
        duration: duration
      });
    }

    if (error.code === 'ENOTFOUND') {
      return res.status(404).json({
        error: 'DNS lookup failed - the hostname could not be resolved',
        duration: duration
      });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({
        error: 'Request timeout - the server took too long to respond',
        duration: duration
      });
    }

    if (error.response) {
      const errorResponse = error.response;
      let errorData;

      try {
        if (typeof errorResponse.data === 'string') {
          errorData = JSON.parse(errorResponse.data);
        } else {
          errorData = errorResponse.data;
        }
      } catch {
        errorData = errorResponse.data;
      }

      return res.json({
        status: errorResponse.status,
        statusText: errorResponse.statusText,
        headers: errorResponse.headers,
        data: errorData,
        duration: duration,
        error: true
      });
    } else if (error.request) {
      return res.status(502).json({
        error: 'No response received from server',
        duration: duration
      });
    } else {
      return res.status(500).json({
        error: error.message,
        duration: duration
      });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/api/proxy`);
  console.log(`📝 History endpoint: http://localhost:${PORT}/api/history`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});