const express = require('express');
const { v4: uuidv4 } = require('uuid');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

// In-memory store for orders
let orders = [];

// Prometheus metrics setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metrics
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

const ordersTotal = new promClient.Gauge({
  name: 'orders_total',
  help: 'Total number of orders'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(ordersTotal);

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
  res.json({ status: 'healthy', service: 'order-service' });
});

// Order endpoints
app.get('/orders', (req, res) => {
  res.json(orders);
});

app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).send('Order not found');
  res.json(order);
});

app.post('/orders', (req, res) => {
  const { userId, productIds } = req.body;
  const newOrder = {
    id: uuidv4(),
    userId,
    productIds,
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  ordersTotal.set(orders.length); // Update gauge
  res.status(201).json(newOrder);
});

app.put('/orders/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).send('Order not found');
  orders[index] = { ...orders[index], ...req.body };
  res.json(orders[index]);
});

app.delete('/orders/:id', (req, res) => {
  const initialLength = orders.length;
  orders = orders.filter(o => o.id !== req.params.id);
  if (orders.length === initialLength) return res.status(404).send('Order not found');
  ordersTotal.set(orders.length); // Update gauge
  res.status(204).send();
});

app.listen(3003, '0.0.0.0', () => {
  console.log('Order Service running on port 3003');
});