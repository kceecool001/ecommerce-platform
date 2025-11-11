const express = require('express');
const { v4: uuidv4 } = require('uuid');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

let products = [];

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const productsTotal = new promClient.Gauge({
  name: 'products_total',
  help: 'Total number of products in inventory'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(productsTotal);

// Middleware to track request metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-service' });
});

// Product endpoints
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).send('Product not found');
  res.json(product);
});

app.post('/products', (req, res) => {
  const product = { id: uuidv4(), ...req.body };
  products.push(product);
  productsTotal.set(products.length); // Update gauge
  res.status(201).json(product);
});

app.put('/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).send('Product not found');
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

app.delete('/products/:id', (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  productsTotal.set(products.length); // Update gauge
  res.status(204).send();
});

app.listen(3001, '0.0.0.0', () => console.log('Product Service running on port 3001'));
