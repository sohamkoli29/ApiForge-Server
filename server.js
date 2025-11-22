const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client (with fallback for missing env vars)
let supabase;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('✅ Supabase client initialized');
  } else {
    console.log('⚠️  Supabase environment variables not found. Using localStorage fallback for data.');
  }
} catch (error) {
  console.log('⚠️  Supabase initialization failed. Using localStorage fallback:', error.message);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (enhanced with database status)
app.get('/api/health', async (req, res) => {
  const healthInfo = { 
    status: 'OK', 
    message: 'API Testing Tool Backend is running',
    database: supabase ? 'Supabase Connected' : 'Local Storage Mode',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };

  // Test Supabase connection if available
  if (supabase) {
    try {
      const { data, error } = await supabase.from('history').select('count').limit(1);
      healthInfo.database = error ? 'Supabase Connection Issue' : 'Supabase Connected';
    } catch (error) {
      healthInfo.database = 'Supabase Connection Failed';
    }
  }

  res.json(healthInfo);
});

// Enhanced History endpoints with Supabase + localStorage fallback
app.post('/api/history/save', async (req, res) => {
  try {
    const { userId, url, method, headers, params, body, responseStatus, duration } = req.body;

    // Try to save to Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('history')
          .insert({
            user_id: userId,
            url,
            method,
            headers: headers ? JSON.stringify(headers) : null,
            params: params ? JSON.stringify(params) : null,
            body: body || null,
            response_status: responseStatus || null,
            duration: duration || null
          })
          .select()
          .single();

        if (!error) {
          return res.json({
            success: true,
            message: 'History saved to database',
            data: {
              id: data.id,
              userId: data.user_id,
              url: data.url,
              method: data.method,
              responseStatus: data.response_status,
              duration: data.duration,
              createdAt: data.created_at
            }
          });
        }
      } catch (supabaseError) {
        console.log('Supabase save failed, falling back to localStorage:', supabaseError.message);
      }
    }

    // Fallback to localStorage simulation (for client-side storage)
    const historyItem = {
      id: Date.now().toString(),
      userId,
      url,
      method,
      headers: headers ? JSON.stringify(headers) : null,
      params: params ? JSON.stringify(params) : null,
      body: body || null,
      responseStatus: responseStatus || null,
      duration: duration || null,
      createdAt: Date.now()
    };

    res.json({
      success: true,
      message: 'History saved locally (database not configured)',
      data: historyItem
    });

  } catch (error) {
    console.error('Save history error:', error);
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

    // Try to fetch from Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error) {
          const formattedData = data.map(item => ({
            id: item.id,
            userId: item.user_id,
            url: item.url,
            method: item.method,
            headers: item.headers,
            params: item.params,
            body: item.body,
            responseStatus: item.response_status,
            duration: item.duration,
            createdAt: new Date(item.created_at).getTime()
          }));

          return res.json({
            success: true,
            data: formattedData,
            message: 'History retrieved from database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase fetch failed:', supabaseError.message);
      }
    }

    // Fallback: return empty array (client will use its own localStorage)
    res.json({
      success: true,
      data: [],
      message: 'Using client-side storage (database not configured)'
    });

  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

// Collections endpoints with Supabase + fallback
app.get('/api/collections/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Try to fetch from Supabase first
    if (supabase) {
      try {
        const { data: collections, error } = await supabase
          .from('collections')
          .select(`
            *,
            collection_items(count)
          `)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!error) {
          const collectionsWithCounts = collections.map(collection => ({
            id: collection.id,
            userId: collection.user_id,
            name: collection.name,
            description: collection.description,
            color: collection.color,
            itemCount: collection.collection_items[0]?.count || 0,
            createdAt: new Date(collection.created_at).getTime(),
            updatedAt: new Date(collection.updated_at).getTime()
          }));

          return res.json({
            success: true,
            data: collectionsWithCounts,
            message: 'Collections retrieved from database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase collections fetch failed:', supabaseError.message);
      }
    }

    // Fallback: return empty array (client will use its own localStorage)
    res.json({
      success: true,
      data: [],
      message: 'Using client-side storage (database not configured)'
    });

  } catch (error) {
    console.error('Fetch collections error:', error);
    res.status(500).json({
      error: 'Failed to fetch collections',
      message: error.message,
      success: false
    });
  }
});

app.post('/api/collections', async (req, res) => {
  try {
    const { userId, name, description, color } = req.body;

    // Try to save to Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('collections')
          .insert({
            user_id: userId,
            name,
            description,
            color
          })
          .select()
          .single();

        if (!error) {
          return res.json({
            success: true,
            data: {
              id: data.id,
              userId: data.user_id,
              name: data.name,
              description: data.description,
              color: data.color,
              createdAt: new Date(data.created_at).getTime(),
              updatedAt: new Date(data.updated_at).getTime()
            },
            message: 'Collection created in database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase collection creation failed:', supabaseError.message);
      }
    }

    // Fallback: return success (client will handle localStorage)
    res.json({
      success: true,
      data: {
        id: 'collection_' + Date.now(),
        userId,
        name,
        description,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      message: 'Collection created locally'
    });

  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({
      error: 'Failed to create collection',
      message: error.message,
      success: false
    });
  }
});

app.post('/api/collections/:collectionId/items', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { userId, name, url, method, headers, params, body, description } = req.body;

    // Try to save to Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('collection_items')
          .insert({
            collection_id: collectionId,
            user_id: userId,
            name,
            url,
            method,
            headers: headers ? JSON.stringify(headers) : null,
            params: params ? JSON.stringify(params) : null,
            body: body || null,
            description: description || null
          })
          .select()
          .single();

        if (!error) {
          // Update collection updated_at
          await supabase
            .from('collections')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', collectionId);

          return res.json({
            success: true,
            data: {
              id: data.id,
              collectionId: data.collection_id,
              userId: data.user_id,
              name: data.name,
              url: data.url,
              method: data.method,
              headers: data.headers,
              params: data.params,
              body: data.body,
              description: data.description,
              createdAt: new Date(data.created_at).getTime(),
              updatedAt: new Date(data.updated_at).getTime()
            },
            message: 'Item added to collection in database'
          });
        }
      } catch (supabaseError) {
        console.log('Supabase item addition failed:', supabaseError.message);
      }
    }

    // Fallback: return success (client will handle localStorage)
    res.json({
      success: true,
      data: {
        id: 'item_' + Date.now(),
        collectionId,
        userId,
        name,
        url,
        method,
        headers: headers ? JSON.stringify(headers) : null,
        params: params ? JSON.stringify(params) : null,
        body: body || null,
        description: description || null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      message: 'Item added to collection locally'
    });

  } catch (error) {
    console.error('Add to collection error:', error);
    res.status(500).json({
      error: 'Failed to add item to collection',
      message: error.message,
      success: false
    });
  }
});

// Proxy endpoint (existing code remains exactly the same - no changes)
app.post('/api/proxy', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { url, method, headers, body, timeout = 30000 ,auth } = req.body;

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

     // Handle authentication if provided
    if (auth && auth.type === 'medimapper' && auth.token) {
      config.headers['Authorization'] = `Bearer ${auth.token}`;
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
  console.log(`🗂️ Collections endpoint: http://localhost:${PORT}/api/collections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (supabase) {
    console.log(`💾 Database: Supabase connected`);
  } else {
    console.log(`💾 Database: Local storage mode (add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env)`);
  }
});