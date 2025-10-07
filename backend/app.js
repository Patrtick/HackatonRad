// backend/app.js
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.listen(3000, () => console.log('Server running on port 3000'));