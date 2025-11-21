const express = require('express');
const app = express();
const PORT = 3002;

app.use(express.json());

// Test endpoints that simulate various API responses
app.get('/api/test/success', (req, res) => {
  res.json({
    message: 'Successful GET request',
    data: [
      { id: 1, name: 'Test Item 1' },
      { id: 2, name: 'Test Item 2' }
    ],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/test/create', (req, res) => {
  res.status(201).json({
    message: 'Resource created successfully',
    id: Math.floor(Math.random() * 1000),
    ...req.body
  });
});

app.put('/api/test/update', (req, res) => {
  res.json({
    message: 'Resource updated successfully',
    ...req.body
  });
});

app.delete('/api/test/delete', (req, res) => {
  res.status(204).send();
});

app.get('/api/test/delay', (req, res) => {
  setTimeout(() => {
    res.json({
      message: 'Delayed response',
      delay: '3 seconds'
    });
  }, 3000);
});

app.get('/api/test/error', (req, res) => {
  res.status(400).json({
    error: 'Bad Request',
    message: 'This is a simulated error response'
  });
});

app.get('/api/test/not-found', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

app.get('/api/test/server-error', (req, res) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server'
  });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('Available test endpoints:');
  console.log('  GET  /api/test/success');
  console.log('  POST /api/test/create');
  console.log('  PUT  /api/test/update');
  console.log('  DELETE /api/test/delete');
  console.log('  GET  /api/test/delay');
  console.log('  GET  /api/test/error');
  console.log('  GET  /api/test/not-found');
  console.log('  GET  /api/test/server-error');
});