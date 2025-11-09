const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const orders = [];

app.get('/orders', (req, res) => {
  res.json(orders);
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
  res.status(201).json(newOrder);
});

app.listen(3003, () => {
  console.log('Order Service running on port 3003');
});
