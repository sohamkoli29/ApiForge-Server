const axios = require('axios');

const proxyRequest = async (req, res) => {
  const startTime = Date.now();

  try {
    const { url, method, headers, body, timeout = 30000, auth } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required', duration: Date.now() - startTime });
    }

    if (!method) {
      return res.status(400).json({ error: 'HTTP method is required', duration: Date.now() - startTime });
    }

    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format', duration: Date.now() - startTime });
    }

    // Security: Block requests to internal networks in production
    if (process.env.NODE_ENV === 'production') {
      const blockedHosts = [
        'localhost', '127.0.0.1', '0.0.0.0', '::1', '10.',
        '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
        '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
        '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
        '172.30.', '172.31.'
      ];
      const hostname = targetUrl.hostname;
      if (blockedHosts.some(blocked => hostname.startsWith(blocked))) {
        return res.status(403).json({
          error: 'Requests to localhost or internal networks are not allowed in production',
          duration: Date.now() - startTime
        });
      }
    }

    const config = {
      method: method.toLowerCase(),
      url: targetUrl.toString(),
      timeout: parseInt(timeout),
      validateStatus: (status) => status >= 200 && status < 600,
      maxRedirects: 0,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024
    };

    if (headers && typeof headers === 'object') {
      config.headers = { ...headers };
      const disallowedHeaders = [
        'host', 'origin', 'referer', 'user-agent',
        'accept-encoding', 'connection', 'content-length'
      ];
      disallowedHeaders.forEach(header => delete config.headers[header]);
      if (!config.headers['user-agent']) {
        config.headers['user-agent'] = 'APITestingTool/1.0.0';
      }
    }

    if (auth && auth.type === 'medimapper' && auth.token) {
      config.headers['Authorization'] = `Bearer ${auth.token}`;
    }

    if (['post', 'put', 'patch', 'delete'].includes(method.toLowerCase()) && body) {
      config.data = body;
    }

    console.log(`Proxying ${method} request to: ${url}`);

    const response = await axios(config);
    const duration = Date.now() - startTime;

    let responseData;
    const contentType = response.headers['content-type'] || '';

    try {
      if (contentType.includes('application/json') && typeof response.data === 'string') {
        responseData = JSON.parse(response.data);
      } else {
        responseData = response.data;
      }
    } catch {
      responseData = response.data;
    }

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: responseData,
      duration,
      size: JSON.stringify(response.data).length,
      redirected: response.request?.res?.responseUrl !== url
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Proxy error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Connection refused - the server may be down or the URL may be incorrect',
        duration
      });
    }
    if (error.code === 'ENOTFOUND') {
      return res.status(404).json({ error: 'DNS lookup failed - the hostname could not be resolved', duration });
    }
    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({ error: 'Request timeout - the server took too long to respond', duration });
    }

    if (error.response) {
      let errorData;
      try {
        errorData = typeof error.response.data === 'string'
          ? JSON.parse(error.response.data)
          : error.response.data;
      } catch {
        errorData = error.response.data;
      }
      return res.json({
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: errorData,
        duration,
        error: true
      });
    }

    if (error.request) {
      return res.status(502).json({ error: 'No response received from server', duration });
    }

    return res.status(500).json({ error: error.message, duration });
  }
};

module.exports = { proxyRequest };
