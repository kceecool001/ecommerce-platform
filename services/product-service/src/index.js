const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

let products = [];

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).send('Product not found');
  res.json(product);
});

app.post('/products', (req, res) => {
  const product = { id: uuidv4(), ...req.body };
  products.push(product);
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
  res.status(204).send();
});

app.listen(3001, () => console.log('Product Service running on port 3001'));
