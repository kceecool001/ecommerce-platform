const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const promClient = require('prom-client');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];
const SECRET = 'your_jwt_secret';

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

const usersTotal = new promClient.Gauge({
  name: 'users_total',
  help: 'Total number of registered users'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(usersTotal);

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
  res.json({ status: 'healthy', service: 'user-service' });
});

// Auth endpoints
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(409).send('Username already exists');
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  usersTotal.set(users.length); // Update gauge
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Optional: get all users (for admin/monitoring purposes)
app.get('/users', (req, res) => {
  res.json(users.map(u => ({ username: u.username })));
});

app.listen(3002, '0.0.0.0', () => console.log('User Service running on port 3002'));